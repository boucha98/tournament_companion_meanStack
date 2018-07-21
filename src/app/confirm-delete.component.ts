import { Component, ViewChild } from '@angular/core';
import { MyModalComponent } from "app/mymodal.component";
import { Subject } from "rxjs/Subject";
import { IDialog, DialogResult } from "app/dialog";

@Component({
    selector: 'confirm-delete',
    template: `
        <mymodal title="Deletion">
            <div body>
                <div> You are deleting a record. Are you sure ? </div>
            </div>
            <div footer>
                <button class="btn btn-default" (click)="confirm()">Yes</button>
                <button class="btn btn-default" (click)="cancel()">No</button>
            </div>
        </mymodal>
    `
})

export class ConfirmDelete implements IDialog {
    @ViewChild(MyModalComponent) modal: MyModalComponent;
    public closed: Subject<DialogResult>;

    show(obj?: any): Subject<DialogResult> {
        this.modal.show();
        this.closed = new Subject<DialogResult>();
        return this.closed;
    }

    cancel(): void {
        this.modal.close();
        this.closed.next({ action: 'cancel', data: undefined });
    }

    confirm(): void {
        this.modal.close();
        this.closed.next({ action: 'update', data: undefined });
    }
}
