import { Injectable }    from '@angular/core';
import { Headers, Http,Response,RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';


@Injectable()
export class STTService {
  private stttokenUrl ='/api/speech-to-text/token/';
  private stturl ='/api/attachment/events/'
  constructor(private http: Http) {
  };

  getTokenInfo(ctx:any): Observable<any>{
    let bodyString = JSON.stringify(  { context:ctx });
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    return this.http.post(this.stttokenUrl,bodyString,options)
           .map((res:Response) => res.json())
  };
  getSpeech(chat:any,eventId:any): Observable<any>{
    let bodyString = JSON.stringify(  { chat:chat });
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    return this.http.post(this.stturl +eventId ,bodyString,options)
           .map((res:Response) => res.json())
  };
}
