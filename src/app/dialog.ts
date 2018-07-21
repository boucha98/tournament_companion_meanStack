import { EventEmitter } from "@angular/core";
import { Subject } from "rxjs/Subject";

export interface DialogResult {
    action: 'update' | 'cancel',
    data: object
}

export interface IDialog {
    show(obj?: any): Subject<DialogResult>
}
