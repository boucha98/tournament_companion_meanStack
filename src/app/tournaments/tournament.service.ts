import { Injectable } from '@angular/core';
import { Observable } from "rxjs/Observable";
import { Http, RequestOptions } from "@angular/http";
import { SecuredHttp } from "app/securedhttp.service";
import { MemberService, Member } from "app/members/member.service";
import { Tools } from "../../tools";


export class Game {
    _id: string;
    game_name: string;
    member1: string;
    member2: string;
    memb1_score: number;
    memb2_score: number;
    round: number;

    constructor(data) {
        this._id = data._id;
        this.game_name = data.game_name;
        this.member1 = data.member1;
        this.member2 = data.member2;
        this.memb1_score = data.memb1_score;
        this.memb2_score = data.memb2_score;
        this.round = data.round;
    }
}

export class Tournament {
    _id: string;
    name: string;
    start: Date;
    finish: Date;
    maxPlayers: Number;
    members: Member[];
    games: Game[];
    closed: boolean;

    constructor(data){
        this._id = data._id;
        this.name = data.name;
        this.start = data.start &&
            data.start.length > 10 ? data.start.substring(0, 10) : data.start;
        this.finish = data.finish &&
            data.finish.length > 10 ? data.finish.substring(0, 10) : data.finish;
        this.maxPlayers = data.maxPlayers;
        this.members = data.members;
        this.games = data.games;
        this.closed = data.closed;
    }
}

const URL = '/api/tournaments/';

@Injectable()
export class TournamentService {
    constructor(private http: SecuredHttp) {
    }

    public getCount(): Observable<number> {
        return this.http.get(URL + 'count')
            .map(result => {
                return result.json();
            })
    }

    public getAll(): Observable<Tournament[]> {
        return this.http.get(URL)
            .map(result => {
                return result.json().map(json => new Tournament(json));
            });
    }

    public getAllSubscribed(memberPseudo): Observable<Tournament[]> {
        return this.http.get(URL + "allsubscribed/" + memberPseudo)
            .map(result => {
                return result.json().map(json => new Tournament(json));
            });
     }

    public getOne(name: string): Observable<Tournament> {  
        return this.http.get(URL + name)
            .map(result => {
                let data = result.json();
                return data.length > 0 ? new Tournament(data[0]) : null;
            });
        // return this.getAll().map(tournaments => 
        //     tournaments.find(t => t.name === name));
    }
    
	public getAllAvailable(memberId): Observable<Tournament[]> {
		return this.http.get(URL + "mid/" + memberId)
			.map(result => {
				return result.json().map(json => new Tournament(json));
        	});
	}

    public update(t: Tournament): Observable<boolean> {
        return this.http.put(URL + t.name,  Tools.removeCircularReferences(t)).map(res => true);
    }

    public delete(t: Tournament): Observable<boolean> {
        return this.http.delete(URL + t.name).map(res => true);
    }

    public add(t: Tournament): Observable<Tournament> {
        return this.http.post(URL, t).map(res => new Tournament(res.json()));
    }

    public addGame(t: Tournament, g: Game ) {
        return this.http.post(URL + 'game/' + t.name, g).map(res => new Game(res.json()));
    }

    public deleteGame(t: Tournament, g: Game) {
        return this.http.delete(URL + 'game/' + t.name + '/' + t._id).map(res => true);
    }

    public updateGame(g: Game) {
        return this.http.put(URL +'game/' + g._id, g).map(res => true);
    }

    
}