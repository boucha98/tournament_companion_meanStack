import { Component, OnInit, Inject, ElementRef, ViewChild, Output, EventEmitter, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { TournamentService, Tournament } from "app/tournaments/tournament.service";
import { IDialog, DialogResult } from "app/dialog";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { MyInputComponent } from "app/myinput.component";
import { MyModalComponent } from "app/mymodal.component";
import { validateConfig } from '@angular/router/src/config';
import { ColumnDef, MyTableComponent } from "app/mytable.component";
import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'edit-tournament',
    templateUrl: 'edit-tournament.component.html'
})
export class EditTournamentComponent implements OnInit, IDialog {
    public frm: FormGroup;
    public ctlName: FormControl;
    public ctlStartDate: FormControl;
    public ctlFinishDate: FormControl;
    public ctlMaxPlayers: FormControl;
    public closed: Subject<DialogResult>;
    public t: Tournament;
    public isDisabled: boolean = false;

    
    @ViewChild(MyModalComponent) modal: MyModalComponent;
    @ViewChild('name') name: MyInputComponent;

    constructor(private tournamentService: TournamentService, private fb: FormBuilder) {
        this.ctlName = this.fb.control('', [Validators.required, Validators.minLength(3),], [this.nameUsed()]);
        this.ctlStartDate = this.fb.control('', [Validators.required, this.validatorStart()], []);
        this.ctlFinishDate = this.fb.control('', []);
        this.ctlMaxPlayers = this.fb.control('', [this.validatorMaxPlayers()], []);
        this.frm = this.fb.group({
            _id: null,
            name: this.ctlName,
            start: this.ctlStartDate,
            finish: this.ctlFinishDate,
            maxPlayers: this.ctlMaxPlayers,
        }, { validator: this.validatorDates });
    }

    // Validateur asynchrone qui vérifie si le name n'est pas déjà utilisé par un autre tournoi
    nameUsed(): any {
        let timeout;
        return (ctl: FormControl) => {
            clearTimeout(timeout);
            let name = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    if (ctl.pristine)
                        resolve(null);
                    else
                        this.tournamentService.getOne(name).subscribe(t => {
                            resolve(t ? { nameUsed: true } : null);
                        });
                }, 300);
            });
        };
    }

    validatorStart(): any {
        return (ctl: FormControl) => {
            if(ctl.pristine) return null;
            const today = this.parseDate(new Date());
            const start = this.parseDate(new Date(ctl.value));
            const valid = today.getTime() < start.getTime() ? null : {invalidStartDate: true};
            return valid;
        }
    }

    // Validateur qui vérifie que la date de fin est >= à la date de début
    validatorDates(g: FormGroup) {
        if(!g.value.start || !g.value.finish) return;
        const valid = g.value.finish >= g.value.start ? null : {invalidDates: true};
        g.get('finish').setErrors(valid);
        if(valid) g.get('finish').markAsDirty();
    }

    // pour update du nombre max de joueurs (vérifier que la nouvelle quantité est >= nombre de membres déjà inscrits)
    validatorMaxPlayers(): any {
        return (ctl: FormControl) => {
            if ((this.t as Tournament) && Object.keys(this.t).length === 0) return;
            if (ctl.pristine) return;
            const newMax = ctl.value;
            return this.t.members.length <= newMax ? null : { invalidMaxPlayersValue: true };
        }
    }

    ngOnInit() {
        this.modal.shown.subscribe(_ => this.name.setFocus(true));
    }

    show(t: Tournament): Subject<DialogResult> {
        this.t = t;
        this.isDisabled = t.closed ? true : false;
        this.closed = new Subject<DialogResult>();
        this.frm.reset();
        this.frm.markAsPristine();
        this.frm.patchValue(t);
        this.modal.show();
        return this.closed;
    }

    update() {
        this.modal.close();
        this.closed.next({ action: 'update', data: this.frm.value });
    }

    cancel() {
        this.modal.close();
        this.closed.next({ action: 'cancel', data: this.frm.value });
    }

    parseDate(d: Date): Date {
        const yyyy = d.getFullYear().toString();
        let mm = (d.getMonth()+1).toString();
        mm = mm.length === 2 ? mm : '0' + mm;
        let dd  = d.getDate().toString();
        dd = dd.length === 2 ? dd : '0' + dd;
        return new Date(yyyy + '-' + mm + '-' + dd);
    }
}
