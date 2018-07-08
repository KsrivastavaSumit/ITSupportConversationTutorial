import {Component, AfterViewChecked, ElementRef, ViewChild, OnInit} from '@angular/core';
import { ConversationService }  from './conversation.service';
import { ClaimService }  from '../claim/claim.service';
import { Sentence } from "./Sentence";
import {ActivatedRoute, Params} from '@angular/router';


@Component({
    moduleId: module.id,
    selector: 'conversation',
    styleUrls:['conversation.css','loaders.css'],   //'loaders.css'
    templateUrl:'conversation.html'
  })

export class ConversationComponent implements OnInit, AfterViewChecked {
  private loadingComplete = false;
  private isLoading = true ;

  currentDialog : Sentence[]=[];
  context={'type':'base','UTCOffset': 0}; // used to keep the Conversation context
  message:string;
  type:string = "base";
  /**
  When creating a conversation component call Watson to get a greetings message as defined in the Dialog. This is more user friendly.
  */
  constructor(private convService : ConversationService, private claimService : ClaimService, private route: ActivatedRoute){
    // depending of the url parameters the layout can be simple or more demo oriented with instruction in html
    this.type=this.route.snapshot.params['type'];
    this.isLoading = true;
    this.loadingComplete = false;
    setTimeout(()=> {
       this.callConversationBFF('');
     }, 4000);

     // send blank to initiate conversation from Wantson side
    //this.callConversationBFF(''); // sending empty to get a welcome
  }

  @ViewChild('scrollMe') private myScrollContainer: ElementRef;

  ngOnInit() {
      this.scrollToBottom();
  }

  ngAfterViewChecked() {
      this.scrollToBottom();
  }

  scrollToBottom(): void {
      try {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch(err) { }
  }

  // variable used for the input field in html page to get user query
  queryString=""

  callConversationBFF(msg:string) {
    this.context['type']=this.type; // inject the type of caller so the BFF can call different conversation workspace
    this.isLoading = true;
    this.loadingComplete = false;
    this.convService.submitMessage(msg,this.context).subscribe(
      data => {
        this.context=data.context;
        let s:Sentence = new Sentence();
        s.direction="from-watson";
        //need to call an fnolService
        if(data.context.Action){
              if (data.context.Action == "createFNOLinSOR")
              {
                  this.context.UTCOffset = new Date().getTimezoneOffset();
                  alert(this.context.UTCOffset);
                  this.claimService.submitClaimInfo(this.context).subscribe(
                      data1=>{
                          s.text ="Here is your reference for future communication: <b>" + data1.eventNumber +"</b>. Thank you for giving us an opportunity to serve.";
                          this.isLoading = false;
                          this.loadingComplete = true;
                          this.currentDialog.push(s);
                          this.claimService.submitChatInfo(this.currentDialog, data1.eventId).subscribe(
                            data2=>{
                            },
                            error=>
                            {
                                alert("Recording could not be sent");
                            }
                          );
                      },
                      error => {
                        s.text = "Sorry, the Third Party claim service could not create the claim at this time.";
                        this.isLoading = false;
                        this.loadingComplete = true;
                      },
                  );
              }
              else if (data.context.Action === "click") {
                  s.text=data.output.text.join() + "<a class=\"btn btn-primary\" href=\""+data.context.url+"\">Here</a>";
                  this.currentDialog.push(s);
              }
        }
        else{
          s.text=data.output.text.join();
          this.isLoading = false;
          this.loadingComplete = true;
          this.currentDialog.push(s);
        }
      },
      error => {
        this.isLoading = false;
        this.loadingComplete = true;
        return "Error occurs in conversation processing";
      },
    );
  }

   responseAvailable(){
       return (!this.isLoading && this.loadingComplete);
   }
  // method called from html button
  submit(){
    let obj:Sentence = new Sentence();
    obj.direction="to-watson";
    obj.text=this.queryString;
    this.currentDialog.push(obj);

    this.isLoading = true;
    this.loadingComplete = false;
    this.callConversationBFF(this.queryString);
    this.queryString="";
  }

  clear(){
    this.currentDialog.length = 0;
    this.context={'type':'base','UTCOffset':0};
    this.callConversationBFF('');
  }

  // instead to click on button if user hits enter/return key
  keyMessage(event){
     if(event.keyCode == 13) {
        this.submit();
      }
  }
}
