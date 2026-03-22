// Free Text-to-Speech using Web Speech API (browser built-in)
// Supports Hindi/Hinglish via 'hi-IN' voice

export function speak(text: string, lang: 'en-IN' | 'hi-IN' = 'en-IN', rate = 0.9): void {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  synth.cancel(); // stop any current speech

  // Clean markdown before speaking
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,3} /gm, '')
    .replace(/\n/g, ' ')
    .slice(0, 500); // limit to 500 chars for TTS

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = 1;

  // Try to find Indian English voice
  const voices = synth.getVoices();
  const preferred = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

  synth.speak(utter);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined') window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined') return false;
  return window.speechSynthesis.speaking;
}
