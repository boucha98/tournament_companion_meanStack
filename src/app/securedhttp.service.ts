import { Component, ViewChild, Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, RequestOptionsArgs, Response } from '@angular/http';
import { AuthHttp, AuthConfig, AUTH_PROVIDERS, JwtHelper } from 'angular2-jwt';
import { Observable } from "rxjs/Rx";
import { environment } from "environments/environment";

export const BASE_URL = environment.production ? '/' : '/';

const URL = BASE_URL;

@Injectable()
export class SecuredHttp {
    /**
     * Instance privée de ce helper qui nous aidera à vérifier si
     * un token est expiré ou non.
     */
    private jwt: JwtHelper = new JwtHelper();

    /**
     * Ici on a besoin à la fois du service Http et du service AuthHttp.
     * Le premier sera utilisé pour accéder aux URL non sécurisées (en l'occurence
     * /api/token) et le second pour accéder aux URL sécurisées.
     */
    constructor(private http: Http, private authHttp: AuthHttp) {
    }

    /**
     * Cette méthode permet de faire le login en interaction avec le serveur.
     * Elle reçoit en paramètres les credentials de l'utilisateur.
     */
    public login(username, password): Observable<boolean> {
        // headers nécessaire pour le post
        var headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
        var options = new RequestOptions({ headers: headers });
        // requête POST non sécurisée pour demander un token
        return this.http.post(URL + 'api/token',
            "pseudo=" + encodeURIComponent(username) +
            "&password=" + encodeURIComponent(password),
            options).map(res => {
                let data = res.json();
                if (data.success) {
                    // si les credentials sont corrects, on reçoit une réponse qui contient le token
                    var token = data.token;
                    console.log("TOKEN_RENEWED");
                    // le login est bon : on stocke les credentials et le token dans le sessionStorage
                    sessionStorage.setItem('pseudo', username);
                    sessionStorage.setItem('password', password);
                    sessionStorage.setItem('id_token', token);
                    sessionStorage.setItem('admin', data.admin);
                    return true;
                }
                else
                    return false;
            }).catch(res => {
                return Observable.of(false);
            });
    }

    /**
     * Pour faire le logout, il suffit de supprimer toutes les infos stockées dans le sessionStorage.
     */
    public logout(): void {
        sessionStorage.removeItem('pseudo');
        sessionStorage.removeItem('password');
        sessionStorage.removeItem('id_token');
        sessionStorage.removeItem('admin');
    }

    /**
     * On définit les 4 méthodes get, delete, post et put qui correspondent aux 4
     * requêtes HTTP correspondantes. Chacune de ces méthodes se contente d'appeler
     * la méthode call() en lui passant une fonction qui permettra d'exécuter la
     * requêtre HTTP via AuthHttp.
     * 
     * Voir rôle de call() ci-dessous.
     * 
     */

    public get(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return this.call(() => { return this.authHttp.get(url, options); });
    }

    public delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
        return this.call(() => { return this.authHttp.delete(url, options); });
    }

    public post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        return this.call(() => { return this.authHttp.post(url, body, options); });
    }

    public put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
        return this.call(() => { return this.authHttp.put(url, body, options); });
    }

    /**
     * Le but de la méthode call() est de préalablement vérifier si le token existe
     * et s'il n'est pas expiré. S'il est expiré, elle en redemande un nouveau. Ensuite
     * elle exécute la fonction lambda (func) qu'elle a reçue en paramètre et qui, elle,
     * fait réellement appel au serveur via AuthHttp. De cette manière, on peut appeler
     * les méthodes ci-dessus sans se préoccuper de vérifier si le token est encore
     * valide. Cette vérification est faite de manière automatique et transparente pour
     * le code qui utilise ce service.
     */
    private call(func): Observable<Response> {
        // Récupère le token depuis le sessionStorage
        var token = sessionStorage.getItem('id_token');
        // Si le token n'existe pas ou s'il est expiré ...
        if (!token || token == 'undefined' || this.jwt.isTokenExpired(token)) {
            var headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
            var options = new RequestOptions({ headers: headers });
            // on demande un nouveau token
            return this.http.post(URL + 'api/token',
                "pseudo=" + encodeURIComponent(sessionStorage.getItem('pseudo')) +
                "&password=" + encodeURIComponent(sessionStorage.getItem('password')),
                options)
                // L'opérateur flatMap permet ici d'enchaîner les requêtes en utilisant
                // le résultat de la première pour effectuer la seconde.
                // Voir http://stackoverflow.com/a/35268597
                .flatMap(res => {
                    // on reçoit le token du serveur
                    var token = res.json().token;
                    console.log("TOKEN_RENEWED");
                    // on le stocke dans sessionStorage
                    sessionStorage.setItem('id_token', token);
                    // on peut maintenant, finalement, faire l'appel à l'API protégée
                    return func();
                });
        }
        // si le token est valide et n'est pas expiré, on peut directement
        // faire appel à l'API protégée
        else
            return func();
    }
}
