import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appCardTilt]',
  standalone: true,
})
export class CardTiltDirective {
  private el = inject(ElementRef<HTMLElement>);

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const host = this.el.nativeElement;
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -(y - centerY) / 5;
    const tiltY = (x - centerX) / 8;

    host.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(15px) scale(1.02)`;
    host.style.borderColor = 'rgba(212, 175, 55, 0.5)';
    host.style.background = 'rgba(8, 25, 53, 0.95)';
    host.style.boxShadow =
      '0 15px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.15)';
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    const host = this.el.nativeElement;
    host.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';
    host.style.borderColor = 'rgba(212, 175, 55, 0.18)';
    host.style.background = 'rgba(4, 12, 28, 0.82)';
    host.style.boxShadow = 'none';
  }
}
