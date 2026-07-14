import {
  Component,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  viewChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
}

@Component({
  selector: 'app-spiderweb-canvas',
  standalone: true,
  template: `<canvas #canvas class="spiderweb-canvas" aria-hidden="true"></canvas>`,
  styles: [
    `
      :host {
        display: block;
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
      }
      .spiderweb-canvas {
        width: 100%;
        height: 100%;
        opacity: 0.9;
      }
    `,
  ],
})
export class SpiderwebCanvasComponent implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationId = 0;
  private w = 0;
  private h = 0;
  private mouse = { x: null as number | null, y: null as number | null };

  private readonly maxParticles = 80;
  private readonly maxDistance = 140;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.canvasRef().nativeElement;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.resize();
    this.initParticles();
    this.animate();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseout', this.onMouseOut);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseout', this.onMouseOut);
  }

  private onResize = (): void => {
    this.resize();
    this.initParticles();
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  };

  private onMouseOut = (): void => {
    this.mouse.x = null;
    this.mouse.y = null;
  };

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    this.w = canvas.width = window.innerWidth;
    this.h = canvas.height = window.innerHeight;
  }

  private initParticles(): void {
    this.particles = Array.from({ length: this.maxParticles }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      size: Math.random() * 2.5 + 1,
      speedX: Math.random() * 0.3 - 0.15,
      speedY: Math.random() * 0.3 - 0.15,
    }));
  }

  private animate = (): void => {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    this.particles.forEach((p, idx) => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = this.w;
      if (p.x > this.w) p.x = 0;
      if (p.y < 0) p.y = this.h;
      if (p.y > this.h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
      ctx.fill();

      for (let j = idx + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < this.maxDistance) {
          const alpha = (1 - dist / this.maxDistance) * 0.45;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
          ctx.lineWidth = 0.65;
          ctx.stroke();
        }
      }

      if (this.mouse.x !== null && this.mouse.y !== null) {
        const mDist = Math.hypot(p.x - this.mouse.x, p.y - this.mouse.y);
        if (mDist < this.maxDistance * 1.4) {
          const mAlpha = (1 - mDist / (this.maxDistance * 1.4)) * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(this.mouse.x, this.mouse.y);
          ctx.strokeStyle = `rgba(212, 175, 55, ${mAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    });

    this.animationId = requestAnimationFrame(this.animate);
  };
}
