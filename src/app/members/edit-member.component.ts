import { Component, OnInit, Inject, ElementRef, ViewChild, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { MemberService, Member, Address } from "app/members/member.service";
import { IDialog, DialogResult } from "app/dialog";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { AuthService } from "app/auth.service";
import { MyInputComponent } from "app/myinput.component";
import { MyModalComponent } from "app/mymodal.component";
import { validateConfig } from '@angular/router/src/config';
import { ColumnDef, MyTableComponent } from "app/mytable.component";
import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'edit-member',
    templateUrl: 'edit-member.component.html'
})
export class EditMemberComponent implements OnInit, IDialog {
    public frm: FormGroup;
    public ctlPseudo: FormControl;
    public ctlProfile: FormControl;
    public ctlPassword: FormControl;
    public ctlBirthDate: FormControl;
    public ctlAdmin: FormControl;
    public closed: Subject<DialogResult>;
    private m: Member;
    columnDefs: ColumnDef[] = [
        { name: 'street_addr', type: 'String', header: 'Street Address', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'postal_code', type: 'String', header: 'Postal Code', width: 2, filter: true },
        { name: 'localization', type: 'Date', header: 'Localization', width: 1, filter: true, align: 'center' }
    ];

    @ViewChild(MyModalComponent) modal: MyModalComponent;
    @ViewChild('pseudo') pseudo: MyInputComponent;
    @ViewChild('address') address: MyTableComponent;

    constructor(private memberService: MemberService, private fb: FormBuilder, public authService: AuthService) {
        this.ctlPseudo = this.fb.control('', [Validators.required, Validators.minLength(3), this.forbiddenValue('abc')], [this.pseudoUsed()]);
        this.ctlPassword = this.fb.control('', [Validators.required, Validators.minLength(3)]);
        this.ctlProfile = this.fb.control('', []);
        this.ctlBirthDate = this.fb.control('', [this.validatorBirthday()], []);
        this.ctlAdmin = this.fb.control(false, []);
        this.frm = this.fb.group({
            _id: null,
            pseudo: this.ctlPseudo,
            password: this.ctlPassword,
            profile: this.ctlProfile,
            birthdate: this.ctlBirthDate,
            admin: this.ctlAdmin
        }, { validator: this.crossValidations});
    }

    // Validateur bidon qui vérifie que la valeur est différente
    forbiddenValue(val: string): any {
        return (ctl: FormControl) => {
            if (ctl.value === val)
                return { forbiddenValue: { currentValue: ctl.value, forbiddenValue: val } }
            return null;
        };
    }

    // Validateur asynchrone qui vérifie si le pseudo n'est pas déjà utilisé par un autre membre
    pseudoUsed(): any {
        let timeout;
        return (ctl: FormControl) => {
            clearTimeout(timeout);
            let pseudo = ctl.value;
            return new Promise(resolve => {
                timeout = setTimeout(() => {
                    if (ctl.pristine)
                        resolve(null);
                    else
                        this.memberService.getOne(pseudo).subscribe(member => {
                            resolve(member ? { pseudoUsed: true } : null);
                        });
                }, 300);
            });
        };
    }

    crossValidations(g: FormGroup) {
        if(!g.value.password || !g.value.profile) return;
        const valid = g.value.password !== g.value.profile ? null : {passwordEqualProfile: true};
        g.get('profile').setErrors(valid);
        if(valid) {
            g.get('profile').markAsDirty();
        }
    }

    validatorBirthday(): any {
        return (ctl: FormControl) => {
            if(ctl.pristine) return null;
            const today = this.parseDate(new Date());
            const birthday = this.parseDate(new Date(ctl.value));
            const valid = today.getTime() > birthday.getTime() ? null : {invalidBirthday: true};
            return valid;
        }
    }

    ngOnInit() {
        this.modal.shown.subscribe(_ => this.pseudo.setFocus(true));
    }

    show(m: Member): Subject<DialogResult> {
        this.m = m;
        this.address.refresh();
        this.closed = new Subject<DialogResult>();
        this.frm.reset();
        this.frm.markAsPristine();
        this.frm.patchValue(m);
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

    get getDataService() {
        return _ => Observable.of(this.m ? this.m.address : []);
    }

    get addService() {
        return a => Observable.of(a);
    }

    get deleteService() {
        return a => {
            this.frm.markAsDirty();
            this.m.address = _.reject(this.m.address, a);
            return Observable.of(a);
        };
    }

    get updateService() {
        return a => Observable.of(a);
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
