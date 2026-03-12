// Tennis ball hit sound
const tennisHitSound = new Audio();
tennisHitSound.src = 'sounds/Tennis Ball Hit - Wii SPORTS TENIS - Sound Effect-[AudioTrimmer.com].mp3';
tennisHitSound.volume = 0.6;

function playHitSound() {
  tennisHitSound.currentTime = 0;
  tennisHitSound.play().catch(e => console.log('Audio play failed:', e));
}
