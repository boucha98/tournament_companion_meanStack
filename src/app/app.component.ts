import { Component, OnInit } from '@angular/core';
import { AuthService } from "app/auth.service";
import { EditMemberComponent } from "app/members/edit-member.component";
import { TournamentSubscribeComponent } from "app/tournaments/tournament-subscribe.component";
import { IDialog, DialogResult } from "app/dialog";
import { MemberService, Member } from "app/members/member.service";
import { TournamentService, Tournament, Game } from "app/tournaments/tournament.service";

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.css']
})

export class AppComponent {
    constructor(private memberService: MemberService, public authService: AuthService, public tournamentService: TournamentService) { }   // n�cessaire car utilis� en binding dans le template

    // editCurrentUser(editMember: IDialog) {
    //     this.memberService.getOne(this.authService.currentUser).subscribe((m: Member) => { 
    //         editMember.show(m).subscribe(res => {
    //             if (res.action === 'cancel') return;
    //             const toUpdate = res.data as Member;
    //             m.password = toUpdate.password;
    //             m.birthdate = toUpdate.birthdate;
    //             m.profile = toUpdate.profile;
    //             this.memberService.update(m).subscribe(() => {});
    //         });
    //     });   
    // }

    subscribeTournament(subTour: IDialog) {
        this.memberService.getOne(this.authService.currentUser).subscribe((m: Member) => {
            subTour.show(m).subscribe(res => {console.log(res)})
        });
    }
}
