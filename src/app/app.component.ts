import { Component, OnInit } from "@angular/core";
import Swal from "sweetalert2";

declare var tracking;

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  title = "DaviviendaTurnos-CAM";
  url =
    "https://tzr3anh3h6.execute-api.us-east-2.amazonaws.com/dev/search-face";
  video = null;
  canvas = null;
  context = null;
  counter = null;
  tracker = null;
  // seconds * minutes
  duration = 3 * 1;
  flag = false;
  request = true;
  interval = null;

  ngOnInit() {
    this.video = document.getElementById("video");
    this.canvas = document.getElementById("canvas");
    this.context = this.canvas.getContext("2d");
    this.counter = 0;

    this.tracker = new tracking.ObjectTracker("face");
    this.tracker.setInitialScale(4);
    this.tracker.setStepSize(2);
    this.tracker.setEdgesDensity(0.1);

    tracking.track("#video", this.tracker, { camera: true });

    this.tracker.on("track", event => {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (event.data.length > 0) {
        if (!this.flag) {
          this.flag = true;
          this.startTimer();
        }
      } else {
        this.flag = false;
      }
      event.data.forEach(rect => {
        this.context.strokeStyle = "#01cc99";
        this.context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        this.context.font = "28px Helvetica";
        this.context.fillStyle = "#fff";
        if (this.duration >= 0) {
          this.context.fillText(
            this.duration,
            rect.x + rect.width / 2,
            rect.y + rect.height / 2
          );
        }
      });
    });
  }

  callSearchFace() {
    //draw image to canvas. scale to target dimensions
    this.context.drawImage(
      this.video,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    //convert to desired file format
    let dataURI = this.canvas.toDataURL("image/jpeg"); // can also use 'image/png'
    let obj = {
      collectionId: "davivienda-faces",
      image: dataURI.replace("data:image/jpeg;base64,", "")
    };
    fetch(`${this.url}`, {
      method: "POST",
      body: JSON.stringify(obj),
      headers: new Headers({ "Content-type": "application/json" })
    })
      .then(v => v.json())
      .then(r => {
        if (r.error) {
          return Promise.reject(r.validation);
        }
        if (
          r.data &&
          r.data.FaceMatches &&
          r.data.FaceMatches.length > 0 &&
          r.userData &&
          r.userData.Item
        ) {
          Swal.fire({
            title: `Bienvenido!!! ${r.userData.Item.client_name}`,
            text: `Su solicutud de ${
              r.userData.Item.request_type
            } será atendida en el módulo ${Math.floor(Math.random() * 5) + 1}`,
            type: "success"
          }).then(() => this.startRead());
        } else {
          Swal.fire({
            title: "No se ha encontrado",
            text: "Su solicitud no ha sido registrada con anterioridad",
            type: "warning"
          }).then(() => this.startRead());
        }
      });
  }

  startRead() {
    setTimeout(() => {
      this.request = true;
      this.duration = 3 * 1;
      this.flag = false;
    }, 3000);
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (--this.duration < 0 && this.request) {
        this.request = false;
        clearInterval(this.interval);
        this.callSearchFace();
      }
    }, 1000);
  }
}
