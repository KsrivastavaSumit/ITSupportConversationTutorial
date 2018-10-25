import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent }         from './app.component';
import { ConversationComponent} from './conv/conversation.component';
import { ConversationService }  from './conv/conversation.service';
import { ClaimService }  from './claim/claim.service';
import { STTService }  from './stt/STT.service';
import { STTComponent } from './stt/stt.component';
import { HomeComponent }        from './home.component';
import { AdvisorComponent}  from './advisor/advisor.component';
import { AdvisorService }   from './advisor/advisor.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BusyModule} from 'angular2-busy';
import { LoadersCssModule } from 'angular2-loaders-css';

const routes: Routes = [
  { path: '', component: HomeComponent,pathMatch: 'full' },
  { path: 'conversation/:type', component: ConversationComponent,pathMatch: 'full' },
  { path: 'advisor', component: AdvisorComponent,pathMatch: 'full'},
  // otherwise redirect to home
  { path: '**', redirectTo: '',pathMatch: 'full' }
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
  providers: [ConversationService,AdvisorService,ClaimService, STTService],
  bootstrap: [AppComponent]
})
export class AppModule { }
