import { Component, ViewChild } from "@angular/core";
import { MemberService, Member } from "app/members/member.service";
import { EditMemberComponent } from "app/members/edit-member.component";
import { ColumnDef, MyTableComponent } from "app/mytable.component";
import { SnackBarComponent } from "app/snackbar.component";
import { Observable } from "rxjs/Observable";

@Component({
    selector: 'memberlist',
    templateUrl: './memberlist.component.html',
})
export class MemberListComponent {
    selectedMember: Member;

    @ViewChild('members') members: MyTableComponent;
    @ViewChild('addresses') addresses: MyTableComponent;

    columnDefs: ColumnDef[] = [
        { name: 'pseudo', type: 'String', header: 'Pseudo', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'profile', type: 'String', header: 'Profile', width: 2, filter: true },
        { name: 'birthdate', type: 'Date', header: 'Birth Date', width: 1, filter: true, align: 'center' },
        { name: 'admin', type: 'Boolean', header: 'Is Admin', width: 1, filter: false, align: 'center' }
    ];
    addressColumnDefs: ColumnDef[] = [
        { name: 'street_addr', type: 'String', header: 'Street Address', width: 1, filter: true, sort: 'asc' },
        { name: 'postal_code', type: 'String', header: 'Postal Code', width: 2, filter: true },
        { name: 'localization', type: 'Date', header: 'Localization', width: 1, filter: true, align: 'center' }
    ];

    constructor(private memberService: MemberService) {
    }

    get getDataService() {
        return m => this.memberService.getAll();
    }

    get addService() {
        return m => this.memberService.add(m);
    }

    get deleteService() {
        return m => this.memberService.delete(m);
    }

    get updateService() {
        return m => this.memberService.update(m);
    }

    public selectedItemChangedMember(item) {
        this.selectedMember = this.members.selectedItem as Member;
        if (this.addresses)
            this.addresses.refresh();
    }

    get getAddressDataService() {
        return m => Observable.of(this.selectedMember ? this.selectedMember.address : []);
    }

    get addAddressService() {
        return a => this.memberService.addAddress(this.selectedMember, a);
    }

    get deleteAddressService() {
        return a => this.memberService.deleteAddress(this.selectedMember, a);
    }

    get updateAddressService() {
        return a =>  this.memberService.updateAddress(this.selectedMember, a);
    }
}