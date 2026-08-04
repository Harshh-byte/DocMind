import { GEMINI_MODEL_LIVE } from "@/lib/config/constants";

export interface GeminiLiveOptions {
  apiKey: string;
  systemInstruction?: string;
  onStatusChange?: (
    status: "disconnected" | "connecting" | "connected" | "error",
  ) => void;
  onAudioLevel?: (level: number) => void;
  onTranscript?: (text: string, isModel: boolean) => void;
  onModelTurnComplete?: (text: string) => void;
  onError?: (err: Error) => void;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private options: GeminiLiveOptions;

  private nextPlayTime: number = 0;
  private playbackSources: AudioBufferSourceNode[] = [];
  private isMuted: boolean = false;
  private hasError: boolean = false;
  private accumulatedResponseText: string = "";

  constructor(options: GeminiLiveOptions) {
    this.options = options;
  }

  async connect() {
    if (this.ws) return;

    this.hasError = false;
    this.options.onStatusChange?.("connecting");

    const host = "generativelanguage.googleapis.com";
    const url = `wss://${host}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.options.apiKey}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.sendSetup();
        this.options.onStatusChange?.("connected");
        this.startRecording().catch((err) => {
          this.options.onError?.(err);
        });
      };

      this.ws.onmessage = async (event) => {
        try {
          let data;
          if (event.data instanceof Blob) {
            const text = await event.data.text();
            data = JSON.parse(text);
          } else {
            data = JSON.parse(event.data);
          }
          this.handleServerMessage(data);
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        this.hasError = true;
        this.options.onStatusChange?.("error");
        this.options.onError?.(new Error("WebSocket connection error."));
      };

      this.ws.onclose = (event) => {
        this.cleanup();
        if (!this.hasError) {
          if (event.code !== 1000 && event.code !== 1005) {
            this.hasError = true;
            this.options.onStatusChange?.("error");
            this.options.onError?.(
              new Error(
                `Session closed by server. Reason: ${event.reason || "Connection refused"} (Code: ${event.code})`,
              ),
            );
          } else {
            this.options.onStatusChange?.("disconnected");
          }
        }
      };
    } catch (err: any) {
      this.options.onStatusChange?.("error");
      this.options.onError?.(err);
    }
  }

  private sendSetup() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const setupMsg = {
      setup: {
        model: GEMINI_MODEL_LIVE,
        generationConfig: {
          responseModalities: ["audio"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text:
                this.options.systemInstruction ||
                "You are a concise and helpful assistant.",
            },
          ],
        },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            silenceDurationMs: 500,
          },
        },
      },
    };

    this.ws.send(JSON.stringify(setupMsg));
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      this.mediaStream = stream;
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )({
        sampleRate: 16000, 
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(
        this.mediaStream,
      );

      this.scriptProcessor = this.audioContext.createScriptProcessor(
        2048,
        1,
        1,
      );
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      const inputSampleRate = this.audioContext.sampleRate;
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        this.options.onAudioLevel?.(average / 128.0);
        if (this.mediaStream && this.ws?.readyState === WebSocket.OPEN) {
          requestAnimationFrame(checkAudioLevel);
        }
      };
      requestAnimationFrame(checkAudioLevel);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isMuted) return;
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBuffer = this.downsampleAndConvertTo16BitPCM(
          inputData,
          inputSampleRate,
        );
        const base64Audio = this.arrayBufferToBase64(pcmBuffer);

        const audioMsg = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64Audio,
              },
            ],
          },
        };

        this.ws.send(JSON.stringify(audioMsg));
      };

      this.nextPlayTime = this.audioContext.currentTime;
    } catch (err) {
      this.options.onError?.(err as Error);
    }
  }

  private handleServerMessage(data: any) {
    if (data.outputAudioTranscription?.text) {
      this.accumulatedResponseText += data.outputAudioTranscription.text;
      this.options.onTranscript?.(data.outputAudioTranscription.text, true);
    }

    if (data.serverContent) {
      const serverContent = data.serverContent;

      if (serverContent.interrupted) {
        this.stopPlayback();
        this.accumulatedResponseText = "";
        return;
      }

      if (serverContent.modelTurn?.parts) {
        for (const part of serverContent.modelTurn.parts) {
          if (part.inlineData?.data) {
            this.playAudioChunk(part.inlineData.data);
          }
        }
      }

      if (serverContent.turnComplete) {
        if (this.accumulatedResponseText.trim()) {
          this.options.onModelTurnComplete?.(this.accumulatedResponseText);
        }
        this.accumulatedResponseText = "";
      }
    }
  }

  private playAudioChunk(base64Pcm: string) {
    if (!this.audioContext) return;

    try {
      const pcmData = this.base64ToFloat32Array(base64Pcm);
      const audioBuffer = this.audioContext.createBuffer(
        1,
        pcmData.length,
        24000,
      );
      audioBuffer.getChannelData(0).set(pcmData);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      if (this.nextPlayTime < now) {
        this.nextPlayTime = now;
      }

      source.start(this.nextPlayTime);
      this.playbackSources.push(source);

      this.nextPlayTime += audioBuffer.duration;

      source.onended = () => {
        this.playbackSources = this.playbackSources.filter((s) => s !== source);
      };
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  }

  private stopPlayback() {
    this.playbackSources.forEach((source) => {
      try {
        source.stop();
      } catch {}
    });
    this.playbackSources = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  getMutedState() {
    return this.isMuted;
  }

  disconnect() {
    this.cleanup();
  }

  private cleanup() {
    if (this.ws) {
      try {
        this.ws.close(1000, "Client disconnected");
      } catch {}
      this.ws = null;
    }

    this.stopPlayback();

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  private downsampleAndConvertTo16BitPCM(
    buffer: Float32Array,
    inputSampleRate: number,
  ): ArrayBuffer {
    const outputSampleRate = 16000;
    if (inputSampleRate === outputSampleRate) {
      const result = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        result[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff;
      }
      return result.buffer;
    }
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i];
        count++;
      }
      const val = count > 0 ? accum / count : 0;
      result[offsetResult] = Math.max(-1, Math.min(1, val)) * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToFloat32Array(base64: string): Float32Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    return float32Array;
  }
}
