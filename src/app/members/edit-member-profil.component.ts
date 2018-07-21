import { Component, OnInit, Inject, ElementRef, ViewChild, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { MemberService, Member, Address } from "app/members/member.service";
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
    selector: 'edit-member-profil',
    templateUrl: 'edit-member-profil.component.html'
})
export class EditMemberProfilComponent implements OnInit {
    public frm: FormGroup;
    public ctlPseudo: FormControl;
    public ctlProfile: FormControl;
    public ctlPassword: FormControl;
    public ctlBirthDate: FormControl;
    public ctlAdmin: FormControl;
    private m: Member;
    columnDefs: ColumnDef[] = [
        { name: 'street_addr', type: 'String', header: 'Street Address', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'postal_code', type: 'String', header: 'Postal Code', width: 2, filter: true },
        { name: 'localization', type: 'Date', header: 'Localization', width: 1, filter: true, align: 'center' }
    ];

    @ViewChild('pseudo') pseudo: MyInputComponent;
    @ViewChild('address') address: MyTableComponent;

    constructor(private memberService: MemberService, private fb: FormBuilder, public authService: AuthService) {
        this.ctlPseudo = this.fb.control('', [Validators.required, Validators.minLength(3), this.forbiddenValue('abc')], []);
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
            admin: this.ctlAdmin,
        },  { validator: this.crossValidations });
    }

    // Validateur bidon qui vérifie que la valeur est différente
    forbiddenValue(val: string): any {
        return (ctl: FormControl) => {
            if (ctl.value === val)
                return { forbiddenValue: { currentValue: ctl.value, forbiddenValue: val } }
            return null;
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
        this.memberService.getOne(this.authService.currentUser)
        .subscribe(res => {
            this.m = res;
            this.formReset();
            this.address.refresh();
        });        
    }

    update() {
        const toUpdate = this.frm.value as Member;
        this.memberService.update(toUpdate)
        .subscribe(res =>{ 
            if(res){
                this.m = toUpdate ;
                this.formReset();
            }
        });
    }

    cancel() {
        this.formReset();
    }

    get getDataService() {
        return _ => Observable.of(this.m ? this.m.address : []);
    }

    get addService() {
        return a =>  this.memberService.addAddress(this.m, a);
    }

    get deleteService() {
        return a =>  this.memberService.deleteAddress(this.m, a);
    }

    get updateService() {
        return a => this.memberService.updateAddress(this.m, a);
    }

    parseDate(d: Date): Date {
        const yyyy = d.getFullYear().toString();
        let mm = (d.getMonth()+1).toString();
        mm = mm.length === 2 ? mm : '0' + mm;
        let dd  = d.getDate().toString();
        dd = dd.length === 2 ? dd : '0' + dd;
        return new Date(yyyy + '-' + mm + '-' + dd);
    }

    formReset(){
        this.frm.reset();
        this.frm.markAsPristine();
        this.frm.patchValue(this.m);
    }
}
