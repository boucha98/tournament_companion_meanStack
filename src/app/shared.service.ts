import { Injectable } from '@angular/core';
import { Subject } from "rxjs/Subject";

@Injectable()
export class SharedService {
    // service qui nous sert à gérer un cas de figure: si un admin s'inscrit à un tournoi 
    // via la boite modale et qu'il se trouve en fonds sur la page tournamentDetails: 
    // les listes de cette page sont mises à jour en même temps de façon dynamique
    private update = new Subject<boolean>();

    // Observable écouté dans tournamentdetails.component (voir dans constructeur)
    public toUpdate = this.update.asObservable();
  
    // Méthode appelée dans tournament-subscribe.component lors d'une inscription
    publishUpdateStatus(data: boolean) {
        this.update.next(data);
    }
}