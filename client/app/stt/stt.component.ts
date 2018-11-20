import {Component, AfterViewChecked, ElementRef, ViewChild, OnInit} from '@angular/core';
import { STTService }  from './STT.service';
import {ActivatedRoute, Params} from '@angular/router';

@Component({
    moduleId: module.id,
    selector: 'stt',
  })

export class STTComponent implements OnInit {
  context={'type':'base'}; // used to keep the Conversation context
  message:string;
  type:string = "base";

  constructor(private sttService : STTService, private route: ActivatedRoute){
    this.type=this.route.snapshot.params['type'];
  }

  ngOnInit() {
  }
  queryString=""

  keyMessage(event){
     if(event.keyCode == 13) {
    //    this.submit();
      }
  }
}
