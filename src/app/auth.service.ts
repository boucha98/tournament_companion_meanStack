import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { SecuredHttp } from 'app/securedhttp.service';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class AuthService {
    isLoggedIn: boolean;

    // store the URL so we can redirect after logging in
    redirectUrl: string;

    constructor(private secHttp: SecuredHttp, private http: Http) {
        this.isLoggedIn = sessionStorage.getItem('id_token') != null;
    }

    login(username, password): Observable<boolean> {
        return this.secHttp.login(username, password).map(res => {
            this.isLoggedIn = res;
            return res;
        });
    }

    logout(): void {
        this.isLoggedIn = false;
        this.secHttp.logout();
    }

    public get currentUser(): string {
        return sessionStorage.getItem('pseudo');
    } 

    public get isAdmin(): boolean {
        return sessionStorage.getItem('admin') === 'true';
    } 
     
    public isPseudoAvailable(pseudo: string): Observable<boolean> {
        return this.http.get('/api/members-no-log/used/' + pseudo).map(res => res.json());
    }

    public signup(member): Observable<boolean> {
        return this.http.post('/api/members-no-log/', member)
            .flatMap(res => this.secHttp.login(member.pseudo, member.password))
            .map(res => {
                this.isLoggedIn = res;
                return res;
            });
    }
}