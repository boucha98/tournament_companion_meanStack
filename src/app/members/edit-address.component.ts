import { Component, OnInit, Inject, ElementRef, ViewChild, Output, EventEmitter, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { MemberService, Member, Address } from "app/members/member.service";
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
    selector: 'edit-address',
    templateUrl: 'edit-address.component.html'
})
export class EditAddressComponent implements OnInit, IDialog {
    public frm: FormGroup;
    public ctlStreetAddr: FormControl;
    public ctlPostalCode: FormControl;
    public ctlLocalization: FormControl;
    public closed: Subject<DialogResult>;
    columnDefs: ColumnDef[] = [
        { name: 'street_addr', type: 'String', header: 'Street Address', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'postal_code', type: 'String', header: 'Postal Code', width: 2, filter: true },
        { name: 'localization', type: 'Date', header: 'Localization', width: 1, filter: true, align: 'center' }
    ];

    @ViewChild(MyModalComponent) modal: MyModalComponent;
    @ViewChild('street') street: MyInputComponent;

    constructor(private memberService: MemberService, private fb: FormBuilder) {
        this.ctlStreetAddr = this.fb.control('', [Validators.required]);
        this.ctlLocalization = this.fb.control('', [Validators.required]);
        this.ctlPostalCode = this.fb.control('', [Validators.required]);
        this.frm = this.fb.group({
            _id: null,
            street_addr: this.ctlStreetAddr,
            postal_code: this.ctlLocalization,
            localization: this.ctlPostalCode,
        }, { validator: null });
    }

    ngOnInit() {
        this.modal.shown.subscribe(_ => this.street.setFocus(true));
    }

    show(m: Member): Subject<DialogResult> {
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
}
