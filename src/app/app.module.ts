import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { ScanQrComponent } from './scan-qr/scan-qr.component';

@NgModule({
  declarations: [
    AppComponent,
    ScanQrComponent,
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
