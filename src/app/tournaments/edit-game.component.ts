import { Component, OnInit, Inject, ElementRef, ViewChild, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { TournamentService, Game } from "app/tournaments/tournament.service";
import { IDialog, DialogResult } from "app/dialog";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { AuthService } from "app/auth.service";
import { MyModalComponent } from "app/mymodal.component";
import { validateConfig } from '@angular/router/src/config';
import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'edit-game',
    templateUrl: 'edit-game.component.html'
})
export class EditGameComponent implements OnInit, IDialog {    
    public closed: Subject<DialogResult>;
    public message: String;
    private g: Game;
    public selected: Number;

    @ViewChild(MyModalComponent) modal: MyModalComponent;

    constructor(private tournamentService: TournamentService, public authService: AuthService) {}

    ngOnInit() {
        // this.modal.shown.subscribe(_ => this.pseudo.setFocus(true));
    }

    show(g: Game): Subject<DialogResult> {
        this.g = g;
        this.closed = new Subject<DialogResult>();
        const currentUser = this.authService.currentUser;
        this.selected = null;
        if (currentUser === this.g.member1) {
            this.selected = this.g.memb1_score;
            this.message = isNaN(this.g.memb2_score) ? '' : "Your opponent already put his score: " + this.g.memb2_score; 
        } else {
            this.selected = this.g.memb2_score;
            this.message = isNaN(this.g.memb1_score) ? '' : "Your opponent already put his score: " + this.g.memb1_score;
        }
        this.modal.show();
        return this.closed;
    }

    update(result) {
        // logique métier: si les 2 member_score du game sont vides le premier qui introduit sont résultat peut le faire librement.
        // le deuxième devra entrer un score cohérent en fonction du premier sinon pas d'introduction en db.
        const currentUser = this.authService.currentUser;
        const r = parseFloat(result);
        if (currentUser === this.g.member1) {
            if (this.checkInvalidInput(this.g.memb2_score, r)) {
                this.message = "Failed: invalid result, please check with your opponent input (" + this.g.memb2_score + ')'
            } else if (r === 0 || r === 0.5 || r === 1){
                this.message = '';
                this.g.memb1_score = r;
                this.tournamentService.updateGame(this.g).subscribe(() => {
                    this.message = "Valid input."
                    setTimeout(() => {
                        this.modal.close();
                        this.closed.next({ action: 'update', data: this.g });
                    }, 1200);
                });
            }
        } else if (currentUser === this.g.member2) {
            if (this.checkInvalidInput(this.g.memb1_score, r)) {
                this.message = "Failed: invalid result, please check with your opponent input (" + this.g.memb1_score + ')'
            } else if (r === 0 || r === 0.5 || r === 1){
                this.message = '';
                this.g.memb2_score = r;
                this.tournamentService.updateGame(this.g).subscribe(() => {
                    this.message = "Valid input."
                    setTimeout(() => {
                        this.modal.close();
                        this.closed.next({ action: 'update', data: this.g });
                    }, 1200);
                });
            }
        }

    }

    checkInvalidInput(member_score: Number, input: Number): Boolean {
        if (member_score === 1 && input !== 0) {
            return true;
        } else if (member_score === 0.5 && input !== 0.5) {
            return true;
        } else if (member_score === 0 && input !== 1) {
            return true;
        }
        return false;
    }

    cancel() {
        this.modal.close();
    }
}
