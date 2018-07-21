import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule, Http, RequestOptions } from "@angular/http";
import { RouterModule } from '@angular/router';
import { AuthHttp, AuthConfig, AUTH_PROVIDERS, provideAuth } from 'angular2-jwt';

import { AppComponent } from './app.component';
import { MemberService } from "app/members/member.service";
import { MemberListComponent } from "app/members/memberlist.component";
import { MemberDetailsComponent } from "app/members/memberdetails.component";
import { TournamentService} from "app/tournaments/tournament.service";
import { TournamentListComponent } from "app/tournaments/tournamentlist.component";
import { TournamentDetailsComponent } from "app/tournaments/tournamentdetails.component";
import { LoginComponent } from "app/login.component";
import { SignupComponent } from "app/signup.component";
import { HomeComponent } from "app/home.component";
import { UnknownComponent } from "app/unknown.component";
import { SecuredHttp } from "app/securedhttp.service";
import { AuthGuard, AdminGuard } from "app/auth-guard.service";
import { AuthService } from "app/auth.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RestrictedComponent } from "app/restricted.component";
import { LogoutComponent } from "app/logout.component";
import { EditMemberProfilComponent } from "app/members/edit-member-profil.component";
import { EditMemberComponent } from "app/members/edit-member.component";
import { EditTournamentComponent } from "app/tournaments/edit-tournament.component";
import { TournamentSubscribeComponent } from "app/tournaments/tournament-subscribe.component";
import { SnackBarComponent } from "app/snackbar.component";
import { MyTableComponent } from "app/mytable.component";
import { MyInputComponent } from "app/myinput.component";
import { ValidationService } from "app/validation.service";
import { MyModalComponent } from "app/mymodal.component";
import { EditAddressComponent } from 'app/members/edit-address.component';
import { EditGameComponent } from 'app/tournaments/edit-game.component';
import { RankingComponent } from 'app/tournaments/ranking.component';
import { ConfirmDelete } from "app/confirm-delete.component";
import { SharedService} from "app/shared.service";

export function authHttpServiceFactory(http: Http, options: RequestOptions) {
    return new AuthHttp(
        new AuthConfig({
            tokenGetter: (() => sessionStorage.getItem('id_token'))
        }),
        http,
        options
    );
}

@NgModule({
    declarations: [
        AppComponent,
        MemberListComponent,
        MemberDetailsComponent,
        TournamentListComponent,
        TournamentDetailsComponent,
        LoginComponent,
        SignupComponent,
        LogoutComponent,
        HomeComponent,
        UnknownComponent,
        RestrictedComponent,
        EditMemberComponent,
        EditMemberProfilComponent,
        EditTournamentComponent,
        TournamentSubscribeComponent,
        SnackBarComponent,
        MyTableComponent,
        MyInputComponent,
        MyModalComponent,
        EditAddressComponent,
        EditGameComponent,
        RankingComponent,
        ConfirmDelete
    ],
    imports: [
        HttpModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forRoot([
            { path: '', redirectTo: 'home', pathMatch: 'full' },
            { path: 'login', component: LoginComponent },
            { path: 'signup', component: SignupComponent },
            {
                path: '',
                canActivate: [AuthGuard],
                children: [
                    { path: 'logout', component: LogoutComponent },
                    { path: 'home', component: HomeComponent },
                    { path: 'tournaments', component: TournamentListComponent },
                    { path: 'editprofil', component: EditMemberProfilComponent },
                    {
                        path: '',
                        canActivate: [AdminGuard],
                        children: [
                            { path: 'members', component: MemberListComponent },
                            { path: 'tournament/:name', component: TournamentDetailsComponent},
                        ]
                    },
                ]
            },
            { path: 'restricted', component: RestrictedComponent },
	    { path: '**', component: UnknownComponent }
        ])
    ],
    providers: [
	{
            provide: AuthHttp,
            useFactory: authHttpServiceFactory,
            deps: [Http, RequestOptions]
        },
        SecuredHttp,
        AuthGuard,
        AdminGuard,
        AuthService,
        MemberService,
        ValidationService,
        TournamentService,
        SharedService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
