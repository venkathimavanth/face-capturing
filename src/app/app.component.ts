import { Component,OnInit, ViewChild, ElementRef , Input } from '@angular/core';
import * as faceapi from 'face-api.js';
import { async } from '@angular/core/testing';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
labeledPhoto;
faceMatcher;
label="";
score = 0.6;
distanceMatcher = 0.7;
inputSize = 640;
showCam = false;
imageSrc = '';
images = { 
  "stright" : 3,
  "right" : 2,
  "left" : 2,
  "up" : 2,
  "up-right" : 0,
  "up-left" : 0,
  "down" : 2,
  "down-right" : 0,
  "down-left" : 0,
};

imageBase64 = { 
  "stright" : [],
  "right" : [],
  "left" : [],
  "up" : [],
  "up-right" : [],
  "up-left" : [],
  "down" : [],
  "down-right" : [],
  "down-left" : [],
};

imageScores = { 
  "stright" : [],
  "right" : [],
  "left" : [],
  "up" : [],
  "up-right" : [],
  "up-left" : [],
  "down" : [],
  "down-right" : [],
  "down-left" : [],
};

fetchimages = { 
  "stright" : "",
  "right" : "",
  "left" : "",
  "up" : "",
  "up-right" : "",
  "up-left" : "",
  "down" : "",
  "down-right" : "",
  "down-left" : "",
};



imageList=[];
keys = Object.keys(this.images);
pointer = 0;
public projectedImage="";
public projectedAngle="";
public actualAngle=""; 
public warning=""


@ViewChild('faceCheck', { static: true }) faceCheck: ElementRef;
@ViewChild('overlay1',{static:true}) overlay1:ElementRef;
  ngOnInit(){
    this.loadModels().then(()=>{this.load()});
  } 
  async load(){
    this.fetchImages()
    this.showCam = false;
  }

  async loadModels(){
    let dirpath ='assets/weights';
    await faceapi.nets.tinyFaceDetector.loadFromUri(dirpath);
    await faceapi.nets.faceRecognitionNet.loadFromUri(dirpath);
    await faceapi.nets.faceLandmark68Net.loadFromUri(dirpath);
  }
  async fetchImages(){
    for(let k=0;k<this.keys.length;k+=1){
      try {
        const img = await faceapi.fetchImage(`assets/FaceAngles/${this.keys[k]}.jpg`);
        this.fetchimages[this.keys[k]] = img.src
      }
      catch(err) {
        console.log("images not found")
      }
      
    }
    this.projectedAngle = "Look : " + "stright"
    this.projectedImage= this.fetchimages["stright"];
  }
  detect(e){
    this.imageSrc = e;
    setTimeout(async()=>{
      this.rec();
  },10)
  }
  async rec(){
    const detections = await faceapi.detectSingleFace(this.faceCheck.nativeElement,new faceapi.TinyFaceDetectorOptions({inputSize:this.inputSize,scoreThreshold:this.score})).withFaceLandmarks().withFaceDescriptor();
    if(detections){
      if(detections.detection.score > 0.5){this.warning="Image was not clear"} 
      if(this.pointer >= this.keys.length){
        console.log(this.imageBase64); 
        console.log("done");
        this.showCam = false;
        this.projectedImage="";
        this.pointer = 0;
        this.warning = "Done";
       } 
      else if(detections.detection.score > 0.5 && this.showCam ){
        
        this.changePointer()//move pointer
        this.projectedImage= this.fetchimages[this.keys[this.pointer]];
        this.warning=""
        this.projectedAngle = "Look : " + this.keys[this.pointer] 

        var eye_right = this.getMeanPosition(detections.landmarks.getRightEye());
        var eye_left = this.getMeanPosition(detections.landmarks.getLeftEye());
        var nose = this.getMeanPosition(detections.landmarks.getNose());
        var mouth = this.getMeanPosition(detections.landmarks.getMouth());
        var jaw = this.getTop(detections.landmarks.getJawOutline());
        var rx = (jaw - mouth[1]) / detections.detection.box.height;
        var ry = (eye_left[0] + (eye_right[0] - eye_left[0]) / 2 - nose[0]) /
        detections.detection.box.width;
        rx += 0.5
        // ry //Closest to 0 is looking forward
        // rx // Closest to 0.5 is looking forward, closest to 0 is looking up
        // console.log(ry ,rx)
          
        let profile = "stright"
        // console.log(this.images)

        if (ry > -0.03 && ry < 0.03){ //y=0
          if (rx > 0.1 && rx < 0.2){ //x=0
            // console.log("stright")
            profile = "stright";
          }
          else if(rx > 0.2){ //x=1
            // console.log("up")
            profile = "up";
          }
          else if(rx < 0.1){ //x=-1
            // console.log("down")
            profile = "down";
          }  
        }
        else if(ry > 0.03){ //y=1
          if (rx > 0.15 && rx < 0.2){ //x=0
            // console.log("right")
            profile = "right";
          }
          else if(rx > 0.2){ //x=1
            // console.log("up-right")
            profile = "up-right";
          }
          else if(rx < 0.15){ //x=-1
            // console.log("down-right")
            profile = "down-right";
          }  
        }
        else if(ry < -0.03){ //y=-1
          if (rx > 0.15 && rx < 0.2){ //x=0
            // console.log("left")
            profile = "left";
          }
          else if(rx > 0.2){ //x=1
            // console.log("up-left")
            profile = "up-left";
          }
          else if(rx < 0.15){ //x=-1
            // console.log("down-left")
            profile = "down-left";
          }
        }  
        this.actualAngle = "You are looking : " + profile
        let len1 = this.images[profile]
        let len2 = this.imageBase64[profile].length
        if( len2 < len1 ){
          // console.log("-----------------------------")
          this.imageScores[profile].splice(len2, 0, detections.detection.score);
          this.imageBase64[profile].splice(len2, 0, this.imageSrc);
        }
        else{
          let i=0;
          for(i =0; i< len2;i+=1){
            if(detections.detection.score > this.imageBase64[profile][i]){
              this.imageBase64[profile].splice(i, 0, this.imageSrc);
              this.imageBase64[profile].pop()  
              this.imageScores[profile].splice(i, 0, detections.detection.score);
              this.imageScores[profile].pop()  
              break
            }
          }
        }        
      }
      const displaySize = { width: this.faceCheck.nativeElement.width, height: this.faceCheck.nativeElement.height }
      // resize the overlay canvas to the input dimensions
      faceapi.matchDimensions(this.overlay1.nativeElement, displaySize)

      /* Display detected face bounding boxes */
      // resize the detected boxes in case your displayed image has a different size than the original
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      // draw detections into the canvas
      faceapi.draw.drawDetections(this.overlay1.nativeElement, resizedDetections)
    }
    else{
      this.warning="Any face not recognised" 
    }
  }
  
  changePointer(){
    while(this.images[this.keys[this.pointer]] == this.imageBase64[this.keys[this.pointer]].length){ 
      this.pointer +=1; 
      // console.log("checkpointer");
      if (this.pointer ==  this.keys.length){
        break;
      }
    }
  }

  getTop(l) {
    return l
      .map((a) => a.y)
      .reduce((a, b) => Math.min(a, b));
  }

  getMeanPosition(l) {
    return l
      .map((a) => [a.x, a.y])
      .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
      .map((a: number) => a / l.length);
  }


  testMatcher(i){
    this.distanceMatcher = i*0.1;
    if(!this.showCam){
      this.rec();
    }
    
  }
  testScore(i){
    this.score = i*0.1;
    if(!this.showCam){
      this.rec();
    }
  
}
testInput(i){
    this.inputSize = i*32;
    if(!this.showCam){
      this.rec();
    }
}
stopCam(){
  this.showCam = !this.showCam;
  if(!this.showCam){
    this.imageSrc = "";
    this.faceCheck.nativeElement.style.display = 'block';
  }
  else{
    this.imageSrc = "";
    this.faceCheck.nativeElement.style.display = 'none';
  }
}
}





    // this.mat2d = []
    // for(let i = 0; i < 3; i+=1){
    //   let temp = []
    //   for(let i = 0; i < 3; i+=1){
    //     temp.push(0)
    //   }
    //   this.mat2d.push(temp)
    // }