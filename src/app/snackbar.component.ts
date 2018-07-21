import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
    selector: 'snackbar',
    template: `
        <div #snackbar id="snackbar">
            <div #content>
                <div id="msg">{{message}}</div><div id="undo" class="btn btn-link" (click)="undo()"><strong>{{action}}</strong></div>
            </div>
        </div>
    `,
    styles: [`
        #snackbar {
            opacity: 0;
            visibility: hidden; /* Show the snackbar */
            width: 25%; /* Set a default minimum width */
            margin-left: -12.5%;
            background-color: #333; /* Black background color */
            color: #fff; /* White text color */
            border-radius: 2px; /* Rounded borders */
            padding: 16px; /* Padding */
            position: fixed; /* Sit on top of the screen */
            z-index: 1; /* Add a z-index if needed */
            left: 50%; /* Center the snackbar */
            bottom: 0px; /* 30px from the bottom */
            transition: all 0.5s;
        }

        #snackbar.alert {
            background-color: red;
        }

        #snackbar.show {
            opacity: 1;
            bottom: 30px;
            visibility: visible;
            transition: visibility 0.5s, opacity 0.5s, bottom 0.5s;
        }

        #msg {
            margin: 0;
            display: inline-block;
            box-sizing: border-box;
            width: 80%;
            text-align: left;
            vertical-align: middle;
        }

        #undo {
            margin: 0;
            display: inline-block;
            box-sizing: border-box;
            width: 20%;
            text-align: right;
            color: white;
            vertical-align: middle;
        }
    `]
})

export class SnackBarComponent implements OnInit {
    @ViewChild('snackbar') snackbar: ElementRef;
    @Input() message: string = '';
    action: string = '';

    private timer: any;
    private undoCallback: Function;
    private closedCallback: Function;

    constructor() { }

    ngOnInit() { }

    undo() {
        clearTimeout(this.timer);
        this.snackbar.nativeElement.className = "";
        if (this.undoCallback) this.undoCallback();
        this.timer = undefined;
    }

    show(message: string, duration: number, undoCallback?: Function, closedCallback?: Function) {
        let e = this.snackbar.nativeElement;
        if (this.timer) {
            clearTimeout(this.timer);
            e.className = '';
            this.timer = undefined;
            setTimeout(() => { this.show(message, duration, undoCallback, closedCallback); }, 300);
        }
        else {
            this.message = message;
            this.action = 'Undo';
            this.undoCallback = undoCallback;
            this.closedCallback = closedCallback;
            e.className = "show";
            this.timer = setTimeout(() => {
                e.className = '';
                if (this.closedCallback) this.closedCallback();
                this.timer = undefined;
            }, duration);
        }
    }

    alert(message: string, action: string = 'Dismiss') {
        let e = this.snackbar.nativeElement;
        this.message = message;
        this.action = action;
        e.className = 'show alert';
    }
}