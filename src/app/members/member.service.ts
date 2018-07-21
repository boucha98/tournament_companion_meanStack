import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Rx";
import { Http, RequestOptions } from "@angular/http";
import { SecuredHttp } from "app/securedhttp.service";
import { TournamentService, Tournament } from "app/tournaments/tournament.service";
import { Tools } from "../../tools";

export class Address {
    _id: string;
    street_addr: string;
    postal_code: string;
    localization: string;

    constructor(data) {
        this._id = data._id;
        this.street_addr = data.street_addr;
        this.postal_code = data.postal_code;
        this.localization = data.localization;
    }
}

export class Member {
    _id: string;
    pseudo: string;
    password: string;
    profile: string;
    birthdate: string;
    address: Address[];
    tournaments: Tournament[];
    admin: boolean;

    constructor(data) {
        this._id = data._id;
        this.pseudo = data.pseudo;
        this.password = data.password;
        this.profile = data.profile;
        this.birthdate = data.birthdate &&
            data.birthdate.length > 10 ? data.birthdate.substring(0, 10) : data.birthdate;
        this.address = data.addresses;
        this.tournaments = data.tournaments;
        this.admin = data.admin;
    }
}

const URL = '/api/members/';

@Injectable()
export class MemberService {
    constructor(private http: SecuredHttp) {
    }

    public getCount(): Observable<number> {
        return this.http.get(URL + 'count')
            .map(result => {
                return result.json();
            })
    }

    public getAll(): Observable<Member[]> {
        return this.http.get(URL)
            .map(result => {
                return result.json().map(json => new Member(json));
            });
    }
	
	public getAllNotAssigned(tournamentId): Observable<Member[]> {
		return this.http.get(URL + "tid/" + tournamentId)
			.map(result => {
				return result.json().map(json => new Member(json));
        	});
	}

    public getOne(pseudo: string): Observable<Member> {
        return this.http.get(URL + pseudo)
            .map(result => {
                let data = result.json();
                return data.length > 0 ? new Member(data[0]) : null;
            });
    }

    public update(m: Member): Observable<boolean> {
        return this.http.put(URL + m.pseudo,  Tools.removeCircularReferences(m)).map(res => true);
    }

    public delete(m: Member): Observable<boolean> {
        return this.http.delete(URL + m.pseudo).map(res => true);
    }

    public add(m: Member): Observable<Member> {
        return this.http.post(URL, m).map(res => new Member(res.json()));
    }

    public addAddress(m: Member, a: Address) {
        return this.http.post(URL + 'address/' + m.pseudo, a).map(res => new Address(res.json()));
    }

    public deleteAddress(m: Member, a: Address) {
        return this.http.delete(URL + 'address/' + m.pseudo + '/' + a._id).map(res => true);
    }

    public updateAddress(m: Member, a: Address) {
        return this.http.put(URL + 'address/' + a._id, a).map(res => true);
    }
}
