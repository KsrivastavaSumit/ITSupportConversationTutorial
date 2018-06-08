import { Injectable }    from '@angular/core';
import { Headers, Http,Response,RequestOptions } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';


@Injectable()
export class ClaimService {
  private claimUrl ='/api/claim/';

  constructor(private http: Http) {
  };

  submitClaimInfo(ctx:any): Observable<any>{
    let bodyString = JSON.stringify(  { context:ctx });
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    return this.http.post(this.claimUrl,bodyString,options)
           .map((res:Response) => res.json())
  }
}
