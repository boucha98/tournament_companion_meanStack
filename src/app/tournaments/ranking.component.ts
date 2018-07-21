import { Component, OnInit, Inject, ElementRef, ViewChild, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { IDialog, DialogResult } from "app/dialog";
import { Subject } from "rxjs/Subject";
import { AuthService } from "app/auth.service";
import { MyModalComponent } from "app/mymodal.component";
import { ColumnDef, MyTableComponent } from "app/mytable.component";
import { MemberService, Member } from "app/members/member.service";
import { TournamentService, Tournament } from "app/tournaments/tournament.service";
import { SharedService } from "app/shared.service";
import { Observable } from 'rxjs/Observable';


@Component({
    selector: 'ranking',
    templateUrl: 'ranking.component.html'
})

export class RankingComponent implements IDialog {
    
    public closed: Subject<DialogResult>;
    @ViewChild(MyModalComponent) modal: MyModalComponent;
    @ViewChild('tournamentRanking') tournamentRanking: MyTableComponent;
    tournament: Tournament;
    membersList = [];
    ranking: ColumnDef[] = [
        { name: 'pseudo', type: 'String', header: 'Pseudo', width: 2, filter: true },
        { name: 'points', type: 'number', header: 'Points', width: 2, key: true, sort: 'desc' },
    ];

    constructor(
        private memberService: MemberService, 
        private tournamentService : TournamentService,
        public authService: AuthService
    ) {}

    show(t: Tournament): Subject<DialogResult> {
        // utilisation de tournamentService.getOne pour avoir la liste populate des Games du tournoi 
        this.membersList = [];
        this.tournamentService.getOne(t.name).subscribe(res => {
            this.tournament = res;
            this.getRankingList();
            this.tournamentRanking.refresh();
        });
        this.closed = new Subject<DialogResult>();
        this.modal.show();
        return this.closed;
    }

    cancel() {
        this.modal.close();
        this.closed.next({ action: 'cancel', data: null });
    }

    get getRankingDataService() {
        return t => Observable.of(this.membersList ? this.membersList : null);
    }

    getRankingList() {
        if (this.tournament) {
            this.tournament.members.forEach(m => {
                let score = 0;
                this.tournament.games.forEach(g => {
                    if (m.pseudo === g.member1 && !isNaN(g.memb1_score) && !isNaN(g.memb2_score)) {
                        score += g.memb1_score;
                    } else if (m.pseudo === g.member2 && !isNaN(g.memb1_score) && !isNaN(g.memb2_score)) {
                        score += g.memb2_score;
                    }
                });
                this.membersList.push({ pseudo: m.pseudo, points: score });
            });
        }
    }
}