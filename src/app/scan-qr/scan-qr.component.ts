import {
  Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, OnDestroy, Input,
  OnChanges, SimpleChanges
} from '@angular/core';
import 'webrtc-adapter/out/adapter_no_global';

@Component({
  selector: 'scan-qr',
  templateUrl: './scan-qr.component.html',
  styleUrls: ['./scan-qr.component.scss']
})
export class ScanQrComponent implements OnInit, OnDestroy, OnChanges {

  @Input() innerImageSrc;
  @Input() pAngle;
  @Input() aAngle; 
  @Input() warn; 


  @Output() image = new EventEmitter<ImageData | string>();

  @ViewChild('canvas', { static: true }) canvas: ElementRef;
  @ViewChild('canvasOverlay', { static: true }) canvasOverlay: ElementRef;
  @ViewChild('video', { static: true }) video: ElementRef;
  public flash = false;
  private width: number;
  private height: number;
  private stream: any;
  shot = false;

  private streamingStopped = false;
  constructor() { }

  ngOnInit() {
    this.start();
  }
  ngOnChanges(changes: SimpleChanges): void {
    // Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    // Add '${implements OnChanges}' to the class.
 
    if (changes.snap) {
      this.shot = changes.snap.currentValue;
    }
  }

  ngOnDestroy() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

  }

  getElements() {
    return {
      canvas: this.canvas.nativeElement,
      canvasOverlay: this.canvasOverlay.nativeElement,
      video: this.video.nativeElement
    };
  }

  start() {
    this.reset();
    this.drawOverlay();
    this.play();
  }

  reset() {
    const { canvas, canvasOverlay, video } = this.getElements();
    const main = video.parentNode;
    canvas.width= this.width = video.width = canvasOverlay.width = main.offsetWidth;
    canvas.height= this.height = video.height = canvasOverlay.height = main.offsetHeight;
    this.streamingStopped = false;
  }

  async play() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
      if (!cameras.length) throw new Error('Camera not found!');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: this.width,
          height: this.height,
          facingMode: 'user'
        },
      });
      const { video } = this.getElements();
      //  this.stream = video.srcObject = stream;
      this.stream = stream;
      video.srcObject = stream;
      this.startScanning();
  }

  startScanning = () => {
    if (this.streamingStopped) return;
    const { canvas, video } = this.getElements();
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // this.canvas.hidden = true;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.image.emit(canvas.toDataURL('image/jpeg'));
    }
    if (!this.streamingStopped) {
      setTimeout(() => {
        this.startScanning();
      }, 100);
    }
  }
  takeSnap() {
    const { canvas, video } = this.getElements();
 
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = this.width/1.7;
      canvas.height = this.height/1.7;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0,canvas.width,canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.image.emit(canvas.toDataURL('image/jpeg',0.8));
      this.reset();
    }
  }

  async switchCamera() {
    if (!this.stream) return;
    const track = this.stream.getVideoTracks()[0];
    const currentMode = track.getSettings().facingMode;
    const newMode = currentMode === 'environment' ? 'user' : 'environment';
    this.stream.getVideoTracks()[0].applyConstraints({
      width: this.width,
      height: this.height,
      facingMode: newMode
    });
    track.applyConstraints({
      facingMode: newMode
    });
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    const { video } = this.getElements();
    const stream1 = await navigator.mediaDevices.getUserMedia({
      video: {
        width: this.width,
        height: this.height,
        facingMode: newMode
      },
    });
    this.stream = stream1;
    video.srcObject = this.stream;
    this.startScanning();
  }

  drawOverlay() {
    const { canvasOverlay } = this.getElements();
    const canvasWidth = this.width;
    const canvasHeight = this.height;
    const scanAreaSize = 400;
    const scanWidhth = 400;
    const x = canvasWidth / 2 - scanWidhth / 2;
    const y = canvasHeight / 2 - scanAreaSize / 2;
    const ctx = canvasOverlay.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.globalCompositeOperation = 'source-out';
    ctx.fillStyle = '#000';
    this.drawRoundRect(ctx, x, y, scanWidhth, scanAreaSize, 25);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

}