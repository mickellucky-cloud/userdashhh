/**
 * Lightweight zero-dependency celebration confetti.
 */
export function triggerConfetti() {
  if (typeof window === 'undefined') return;

  const count = 40;
  const colors = ['#7A12F5', '#09B4FF', '#2FBD8E', '#FFD60A', '#FF0055'];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.zIndex = '9999';
    el.style.width = `${Math.floor(Math.random() * 8 + 6)}px`;
    el.style.height = `${Math.floor(Math.random() * 8 + 6)}px`;
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.top = '60%';
    el.style.left = `${Math.floor(Math.random() * 60 + 20)}%`;
    el.style.pointerEvents = 'none';
    el.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
    el.style.transform = 'translate3d(0, 0, 0)';

    document.body.appendChild(el);

    const destX = (Math.random() - 0.5) * 400;
    const destY = -Math.random() * 300 - 100;
    const rot = Math.random() * 720 - 360;

    requestAnimationFrame(() => {
      el.style.transform = `translate3d(${destX}px, ${destY}px, 0) rotate(${rot}deg)`;
      el.style.opacity = '0';
    });

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1300);
  }
}
