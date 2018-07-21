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
    selector: 'tournament-subscribe',
    templateUrl: 'tournament-subscribe.component.html'
})

export class TournamentSubscribeComponent implements IDialog {
    
    public message: string;
    public closed: Subject<DialogResult>;
    @ViewChild(MyModalComponent) modal: MyModalComponent;
    @ViewChild('tournamentsNoSubscribe') tournamentsNoSubscribe: MyTableComponent;
    member: Member;
    selectedTournament: Tournament;
    tournamentsAvailables: Tournament[];
    noSubscribe: ColumnDef[] = [
        { name: 'name', type: 'String', header: 'Name', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'start', type: 'Date', header: 'Start Date', width: 2, filter: true },
        { name: 'finish', type: 'Date', header: 'Finish Date', width: 1, filter: true, align: 'center' }
    ];

    constructor(
        private memberService: MemberService, 
        private tournamentService : TournamentService,
        private sharedService : SharedService,
        public authService: AuthService
    ) {}

    show(m: Member): Subject<DialogResult> {
        this.member = m;
        this.message = null;
        this.tournamentService.getAllAvailable(m._id).subscribe(res => {
            this.tournamentsAvailables = res;
            if (res.length === 0) { this.message = "No tournament available."; }
            this.tournamentsNoSubscribe.refresh(); 
            this.modal.show();           
        });
        this.closed = new Subject<DialogResult>();
        return this.closed;
    }

    cancel() {
        this.modal.close();
        this.closed.next({ action: 'cancel', data: null });
    }

    get getNoSubDataService() {
        return t => Observable.of(this.tournamentsAvailables ? this.tournamentsAvailables : null);
    }

    public selectedItemChanged(item) {
        this.message = null;
        this.selectedTournament = this.tournamentsNoSubscribe.selectedItem as Tournament;
    }

    subscribeToTournament() {
        if (this.selectedTournament) {
            this.member.tournaments.push(this.selectedTournament);
            this.memberService.update(this.member).subscribe(res => { 
                this.sharedService.publishUpdateStatus(true); // on avertit les composants écouteurs, du changement en db pour MAJ de l'affichage
            });
            this.selectedTournament.members.push(this.member);
            this.tournamentService.update(this.selectedTournament).subscribe(res => { 
                this.sharedService.publishUpdateStatus(true);  // on avertit les composants écouteurs, du changement en db pour MAJ de l'affichage
            });
            let i = 0;
            this.tournamentsAvailables.forEach(t => {
                if (t._id === this.selectedTournament._id) {
                    this.tournamentsAvailables.splice(i, 1);
                }
                ++i;
            })
            this.message = "Success subscribing to " + this.selectedTournament.name;
            this.tournamentsNoSubscribe.refresh();
            this.selectedTournament = null;
        }
    }
}