import { Observable } from "rxjs/Observable";
import * as moment from 'moment';
import * as _ from 'lodash';

export type SortDirection = 'asc' | 'desc' | '';

export class MyDataSource<T> {
    private _data: T[] = [];
    private _dataView: T[];
    private _sort: string;
    private _direction: SortDirection = 'asc';
    private _filter: string = '';
    private _pageSize: number = 0;
    private _pageIndex: number = 0;
    private _filteredDataLength: number = 0;

    constructor(objects: T[], private key: string, private filteredProps: string[]) {
        this._data = objects;
        this.refresh();
    }

    get data(): T[] {
        return this._dataView;
    }

    get filter(): string { return this._filter; }
    set filter(filter: string) { this._filter = filter; this._pageIndex = 0; this.refresh(); }

    get sort(): string { return this._sort }
    set sort(v: string) {
        if (v === this._sort)
            this._direction = this._direction === 'asc' ? 'desc' : 'asc';
        else
            this._direction = 'asc';
        this._sort = v;
        this.refresh();
    }

    get direction(): SortDirection { return this._direction }
    set direction(v: SortDirection) {
        this._direction = v;
        this.refresh();
    }

    get pageIndex(): number { return this._pageIndex }
    set pageIndex(v: number) {
        this._pageIndex = v;
        this.refresh();
    }

    get pageSize(): number { return this._pageSize }
    set pageSize(v: number) {
        this._pageSize = v;
        this.refresh();
    }

    get numPages(): number {
        return this._pageSize == 0 ? 1 : (this._filteredDataLength + this._pageSize) / this._pageSize - 1;
    }

    private refresh() {
        if (!this._data) return;
        this._dataView = this._data.slice();
        this.sortData();
        this.filterData();
        this.paginateData();
    }

    private sortData() {
        if (this._sort && this._direction) {
            this._dataView.sort((a, b) => {
                let valueA = a[this._sort] || null;
                let valueB = b[this._sort] || null;
                let order;
                if (valueA === null)
                    order = -1;
                else if (valueA !== null && valueB === null)
                    order = 1;
                else
                    order = valueA < valueB ? -1 : 1;
                return order * (this._direction == 'asc' ? 1 : -1);
            });
        }
    }

    private filterData() {
        if (this._filter && this.filteredProps.length > 0) {
            this._dataView = this._dataView.filter((obj: T) => {
                let searchStr = obj[this.key];
                for (var p of this.filteredProps)
                    searchStr += obj[p];
                searchStr = searchStr.toLowerCase();
                return searchStr.indexOf(this._filter.toLowerCase()) != -1;
            });
        }
        this._filteredDataLength = this._dataView.length;
    }

    private paginateData() {
        if (this._pageSize > 0) {
            const startIndex = this._pageIndex * this._pageSize;
            this._dataView = this._dataView.splice(startIndex, this._pageSize);
            if (this._dataView.length == 0 && this._pageIndex > 0)
                this.pageIndex--;
        }
    }

    add(obj: T) {
        this._data.push(obj);
        this.refresh();
    }

    delete(obj: T) {
        this._data.splice(this._data.indexOf(obj), 1);
        this.refresh();
    }

    update(obj: T, old: T) {
        let i = this._data.findIndex(mm =>  _.isEqual(mm, old));
        this._data[i] = obj;
        this.refresh();
    }

    public get length() {
        return this._data.length;
    }

    public getItem(i: number) {
        if (i < 0 || i > this._dataView.length) return null;
        return this._dataView[i];
    }

    public indexOf(obj: object) {
        return _.indexOf(this._dataView, obj)
    }
}
