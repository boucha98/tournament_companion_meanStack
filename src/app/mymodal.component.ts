import { Component, OnInit, Inject, ElementRef, ViewChild, Output, EventEmitter, TemplateRef, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { MyInputComponent } from "app/myinput.component";

declare var $: any;

@Component({
    selector: 'mymodal',
    template: `
        <div #myModal id="myModal" class="modal fade" role="dialog">
            <div class="modal-dialog">
                <!-- Modal content-->
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                        <h2 class="modal-title">{{title}}</h2>
                    </div>
                    <div class="modal-body">
                        <ng-content select="[body]"></ng-content>
                    </div>
                    <div class="modal-footer">
                        <ng-content select="[footer]"></ng-content>
                    </div>
                </div>
            </div>
        </div>
    `
})

export class MyModalComponent implements OnInit {
    @Input() title: string = '';
    @Output() shown: EventEmitter<any> = new EventEmitter();
    @Output() closed: EventEmitter<any> = new EventEmitter();
    @ViewChild('myModal') modal: ElementRef;
    private modalElement;

    constructor() {
    }

    ngOnInit() {
        this.modalElement = $(this.modal.nativeElement);
        this.modalElement.on('shown.bs.modal', () => { this.shown.emit(this); });
        this.modalElement.on('hidden.bs.modal', () => { this.closed.emit(this); });
    }

    show() {
        this.modalElement.modal({ backdrop: 'static', keyboard: true });
    }

    close() {
        this.modalElement.modal('hide');
    }
}