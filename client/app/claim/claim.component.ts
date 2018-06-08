import {Component, AfterViewChecked, ElementRef, ViewChild, OnInit} from '@angular/core';
import { ClaimService }  from './claim.service';
import {ActivatedRoute, Params} from '@angular/router';

@Component({
    moduleId: module.id,
    selector: 'claim',
  })

export class ClaimComponent implements OnInit, AfterViewChecked {
  context={'type':'base'}; // used to keep the Conversation context
  message:string;
  type:string = "base";

  constructor(private claimService : ClaimService, private route: ActivatedRoute){
    // depending of the url parameters the layout can be simple or more demo oriented with instruction in html
    this.type=this.route.snapshot.params['type'];
    // Uncomment this line if you do not have a conversation_start trigger in a node of your dialog
//    this.callConversationBFF(''); // sending empty to get a welcome
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

  /*callConversationBFF(msg:string) {
    this.context['type']=this.type; // inject the type of caller so the BFF can call different conversation workspace
    this.convService.submitMessage(msg,this.context).subscribe(
      data => {
        this.context=data.context;
        let s:Sentence = new Sentence();
        s.direction="from-watson";
        if (data.context.action != "createFNOLinSOR")
        {

        }

        if (data.context.url != undefined) {
          if (data.context.action === "click") {
              s.text=data.output.text.join() + "<a class=\"btn btn-primary\" href=\""+data.context.url+"\">Here</a>"
            }
            else
            {
              s.text=data.output.text.join() +data.context.url;
            }
          }
        else
        {

          s.text=data.output.text.join();
        }
        this.currentDialog.push(s)
      },
      error => {
        return "Error occurs in conversation processing"
        }
    )
  }*/

  // method called from html button
  /*submit(){
    let obj:Sentence = new Sentence();
    obj.direction="to-watson";
    obj.text=this.queryString;
    this.currentDialog.push(obj);
    this.callConversationBFF(this.queryString);
    this.queryString="";
  }*/

  // instead to click on button if user hits enter/return key
  keyMessage(event){
     if(event.keyCode == 13) {
    //    this.submit();
      }
  }
}
