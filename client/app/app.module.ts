import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent }         from './app.component';
import { ConversationComponent} from './conv/conversation.component';
import { ConversationService }  from './conv/conversation.service';
import { ClaimService }  from './claim/claim.service';
import { HomeComponent }        from './home.component';
import { AdvisorComponent}  from './advisor/advisor.component';
import { AdvisorService }   from './advisor/advisor.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BusyModule} from 'angular2-busy';
import { LoadersCssModule } from 'angular2-loaders-css';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'conversation/:type', component: ConversationComponent },
  { path: 'advisor', component: AdvisorComponent},
  // otherwise redirect to home
  { path: '**', redirectTo: '' }
]

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ConversationComponent,
    AdvisorComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    BrowserAnimationsModule,
    BusyModule,
    LoadersCssModule,
    RouterModule.forRoot(routes)
  ],
  providers: [ConversationService,AdvisorService,ClaimService],
  bootstrap: [AppComponent]
})
export class AppModule { }
