import { Component, OnInit, Input, ViewChild, ElementRef, TemplateRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";
import { SnackBarComponent } from "app/snackbar.component";
import { Observable } from "rxjs/Observable";
import { MyDataSource, SortDirection } from "app/mydatasource";
import { IDialog, DialogResult } from "app/dialog";
import { Router } from '@angular/router';
import { ConfirmDelete } from "app/confirm-delete.component";
import * as _ from 'lodash';
import * as moment from 'moment';

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';

export interface ColumnDef {
    // nom du champ/attribut associé à la colonne
    name: string,
    // type de donnée pour les valeurs affichées dans cette colonne (ex: String, Date, Bool)
    type: string,
    // en-tête de la colonne
    header: string,
    // largeur de la colonne (les largeurs sont gérées de manière proportionnelles sur l'ensemble des colonnes)
    width?: number,
    // indique si la colonne contient la donnée "clé" (identifiante) d'un record affiché
    key?: boolean,
    // indique si la colonne doit être prise en compte dans le filtrage des données 
    filter?: boolean,
    // indique si la colonne le tri initial de la table doit être fait sur base de cette colonne
    sort?: SortDirection,
    // indique comment le texte doit être aligné horizontalement à l'affichage dans cette colonne
    align?: 'left' | 'right' | 'center' | 'justify' | ''
}

@Component({
    selector: 'mytable',
    templateUrl: 'mytable.component.html',
    styleUrls: ['mytable.component.css']
})
export class MyTableComponent implements OnInit, AfterViewInit {
    dataSource: MyDataSource<object> = new MyDataSource([], '', []);
    filteredColumns: string[] = [];
    key: string = '_id';
    sort: string;
    direction: string;
    errors: string[] = [];
    _selectedIndex: number = -1;

    @Input() columnDefs: ColumnDef[] = [];
    @Input() getDataService: () => Observable<any[]>;
    @Input() addService: (any) => Observable<any>;
    @Input() deleteService: (any) => Observable<boolean>;
    @Input() updateService: (any) => Observable<boolean>;
    @Input() filterPlaceHolder: string = 'Filter';
    @Input() editComponent: IDialog;
    @Input() addCaption: string = 'Add New Item';
    @Input() pageSize: number = 0;
    @Input() cancellable: boolean = false;
    @Input() confirmDelete: boolean = true;
    @Input() cancelTimeout: number = 5000;
    @Input() readOnly = false;
	@Input() redirection = null;
    @Output() selectedItemChanged: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild('snackbar') snackbar: SnackBarComponent;
    @ViewChild('filter') filter: ElementRef;
    @ViewChild('confirmdelete') confirm: ConfirmDelete;

    constructor(private domSanitizer: DomSanitizer, private router: Router) { }

    refresh() {
        if (!this.getDataService) return;
        this.getDataService().subscribe(objects => {
            this.dataSource = new MyDataSource(objects, this.key, this.filteredColumns);
            this.dataSource.sort = this.key;
            this.dataSource.pageSize = this.pageSize;
        }, err => {
            this.snackbar.alert('ERROR: ' + err);
        });
    }

    ngOnInit() {
        this.columnDefs.forEach(c => {
            if (c.key)
                this.key = c.name;
            if (c.filter)
                this.filteredColumns.push(c.name);
            if (c.sort) {
                this.sort = c.name;
                this.direction = c.sort;
            }
        });

        if (!this.key)
            this.errors.push("You must define one column as the key (identifying column)");

        this.refresh();
    }

    ngAfterViewInit(): void {
        this.refresh();

        // Permet de ne modifier le filtre de la source de données quand quand l'utilisateur a fini de taper
        if (this.filter)
            Observable.fromEvent(this.filter.nativeElement, 'keyup')
                .debounceTime(150)
                .distinctUntilChanged()
                .subscribe(() => {
                    if (this.dataSource)
                        this.dataSource.filter = this.filter.nativeElement.value;
                    this.selectedIndex = -1;
                });
    }

    headerClicked(c: ColumnDef) {
        this.dataSource.sort = c.name;
        this.selectedIndex = -1;
    }

    getHeaderStyle(c: ColumnDef) {
        let s = 'text-align:' + c.align + ';cursor:pointer' + ";width:" + c.width + "%";
        return this.domSanitizer.bypassSecurityTrustStyle(s);
    }

    getCellStyle(c: ColumnDef) {
        let s = 'text-align:' + c.align;
        return this.domSanitizer.bypassSecurityTrustStyle(s);
    }

    getSortClass(c: ColumnDef) {
        if (c.name === this.dataSource.sort)
            if (this.dataSource.direction === 'asc')
                return 'fa fa-fw fa-sort-asc';
            else if (this.dataSource.direction === 'desc')
                return 'fa fa-fw fa-sort-desc';
            else
                return 'fa fa-fw fa-sort';
        else
            return '';
    }

    getPages() {
        return _.range(this.dataSource.numPages);
    }

    pageClicked(i: number) {
        this.dataSource.pageIndex = i;
        this.selectedIndex = -1;
    }

    getValue(row, col: ColumnDef) {
        let val = row[col.name];
        if (val && col.type === 'Date' && moment(val).isValid())
            return moment(val).format('DD/MM/YYYY');
        return val;
    }

    private _add(obj: object) {
        this.addService(obj).subscribe(member => {
            this.dataSource.update(member, obj);
        }, err => {
            console.log(err)
            this.snackbar.alert('ERROR: ' + err);
        });
    }

    public add(obj: object) {
        this.dataSource.add(obj);
        this.selectedIndex = -1;
        if (this.cancellable) {
            this.snackbar.show(`Record successfully added`, this.cancelTimeout,
                () => {
                    this.dataSource.delete(obj);
                },
                () => {
                    this._add(obj);
                });
        }
        else
            this._add(obj);
    }

    private _delete(obj: object) {
        this.deleteService(obj).subscribe(result => {
        }, err => {
            console.log(err)
            this.snackbar.alert('ERROR: ' + err);
        });
    }

    public delete(obj: object) {
        const delAction = () => {
            this.dataSource.delete(obj);
            this.selectedIndex = -1;
            if (this.cancellable) {
                this.snackbar.show(`Record successfully deleted`, this.cancelTimeout,
                    () => this.dataSource.add(obj),
                    () => this._delete(obj)
                );
            }
            else
                this._delete(obj);
        }
        if (this.confirmDelete)
            this.confirm.show().subscribe(res => {
                if (res.action === 'cancel') return;
                delAction();
            });
        else
            delAction();
    }

    private _update(updated: object): void {
        this.updateService(updated).subscribe(result => {
        }, err => {
            console.log(err)
            this.snackbar.alert('ERROR: ' + err);
        });
    }

    public update(updated: object, old: object) {
        this.dataSource.update(updated, old);
        if (this.cancellable) {
            this.snackbar.show(`Record successfully updated`, this.cancelTimeout,
                () => {
                    this.dataSource.update(old, updated);
                },
                () => {
                    this._update(updated);
                });
        }
        else
            this._update(updated);
    }

    public edit(obj: object = {}) {
        this.editComponent.show(obj).subscribe(res => {
            if (res.action === 'cancel') return;
            let updated = _.merge({}, obj, res.data);
            if (updated._id)
                this.update(updated, obj);
            else
                this.add(updated);
        });
    }

    rowClicked(i: number) {
        this.selectedIndex = i;
    }

    get selectedIndex() {
        return this._selectedIndex;
    }

    set selectedIndex(value: number) {
        this._selectedIndex = value;
        if (this.selectedItemChanged)
            this.selectedItemChanged.emit(this.selectedItem);
    }

    get selectedItem() {
        return this.dataSource.getItem(this._selectedIndex);
    }
	
	public goTo(obj: object = {}) {
		if(this.redirection) {
            this.redirection(obj);
        }
	}
}
