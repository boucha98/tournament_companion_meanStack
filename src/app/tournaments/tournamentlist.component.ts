import { Component, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { IDialog, DialogResult } from "app/dialog";
import { ColumnDef, MyTableComponent } from "app/mytable.component";
import { TournamentService, Tournament, Game } from "app/tournaments/tournament.service";
import { Observable } from "rxjs/Observable";
import { Router } from '@angular/router';
import { AuthService } from "app/auth.service";
import { SnackBarComponent } from "app/snackbar.component";

@Component({
    selector: 'tournamentslist',
    templateUrl: 'tournamentlist.component.html'
})

export class TournamentListComponent /*implements OnInit*/ {
    //public tournaments: Tournament[];
    selectedTournament: Tournament;
    listGames;


    @ViewChild('tournaments') tournaments: MyTableComponent;
    @ViewChild('snackbar') snackbar: SnackBarComponent;
    @ViewChildren('rounds') rounds: QueryList<MyTableComponent>;

    columnDefs: ColumnDef[] = [
        { name: 'name', type: 'String', header: 'Name', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'start', type: 'Date', header: 'Start Date', width: 2, filter: true },
        { name: 'finish', type: 'Date', header: 'Finish Date', width: 1, filter: true, align: 'center' },
        { name: 'maxPlayers', type: 'Number', header: 'Max Players', width: 1, filter: false, align: 'center' }
    ];

    gameColumnDefs: ColumnDef[] = [
        { name: 'member1', type: 'String', header: 'Player1', width: 2, filter: true },
        { name: 'memb1_score', type: 'String', header: 'Player1 Score ', width: 3, filter: false },
        { name: 'memb2_score', type: 'String', header: 'Player2 Score ', width: 3, filter: false },
        { name: 'member2', type: 'String', header: 'Player2', width: 2, filter: true },
    ];


    constructor(private tournamentService: TournamentService, private router: Router, public authService: AuthService) { }

    get getDataService() {
        /* if (this.authService.isAdmin) */ return t => this.tournamentService.getAll();
        // else return t => this.tournamentService.getAllSubscribed(this.authService.currentUser);
    }

    get addService() {
        return t => this.tournamentService.add(t);
    }

    get deleteService() {
        return t => this.tournamentService.delete(t);
    }

    get updateService() {
        return t => this.tournamentService.update(t);
    }

    public selectedItemChanged(item) {//creer une methode asychrone pour obtenir la liste populate des games
        this.selectedTournament = this.tournaments.selectedItem as Tournament;
        if((this.selectedTournament as Tournament) && this.selectedTournament.games) {
            this.tournamentDisplayRounds();
            if (this.rounds) {
                this.rounds.changes.subscribe(() => {
                    this.rounds.toArray().forEach(round => {
                        round.refresh();
                    });
                });
            }
        } else {
            this.listGames = null;
            this.rounds = null;
        }
    }

    get getGameDataService() {
        return g => Observable.of(this.selectedTournament? this.selectedTournament.games : null);//getAllGame(this.selectedTournament.game)? this.selectedTournament.game : null);
    }

    get AddGameService() {
        return g => this.tournamentService.addGame(this.selectedTournament, g);
    }

    get deleteGameService() {
        return g =>  this.tournamentService.deleteGame(this.selectedTournament, g);
    }

    get updateGameService() {
        return g =>  this.tournamentService.updateGame(g);
    }
    // méthode appelée sur l'évènement click dans le composant myTable [redirection]
    public goToDetails(obj: object = {}) {
        const t = obj as Tournament;
        this.router.navigate(['/tournament',t.name]);
    }
    // méthode utilisée pour le myTable qui liste les tournois: seul un admin a accès aux actions delete, update ou details
    // pour liste des matchs : voir pour un bouton qui permet d'éditer les résultats pour le membre connecté
    public actionsAdmin() {
        return this.authService.isAdmin ? false : true;
    }

    tournamentDisplayRounds() {
        if(this.selectedTournament.games.length > 0) {
            // on utilise la méthode sort() car les games ne sont pas dans l'ordre (enregistrement en db asynchrone)
            const list = this.selectedTournament.games.sort((a, b) => { return a.round - b.round});
            const nbRound = list[list.length - 1].round;
            this.listGames = []; // liste à afficher dans la vue, les matchs y seront organisés par tour (tableau à 2 dimensions)
            let count = 0;
            for(let i = 0; i < nbRound; ++i) {
                this.listGames[i] = [];
                for(let j = count; j < list.length && list[j].round === i + 1; ++j) {
                    this.listGames[i].push(new Game(list[j]));
                    ++count;
                }
            }
        } else {
            this.listGames = null;
        }
    }
    // On fournit aux ColumnDef de l'affichage des games un objet formaté correspondant au game fourni
    convertToObservableToDisplay(games: Game[]) {
        const format = games.map(g => {
            return {
                game_name: g.game_name,
                member1: g.member1,
                member2: g.member2,
                memb1_score: this.textDisplayForScores(g.memb1_score, g.memb2_score, g.member1, g.member2),
                memb2_score: this.textDisplayForScores(g.memb2_score, g.memb1_score, g.member1, g.member2),
            }
        });
        return g => Observable.of(format);
    }

    textDisplayForScores(score1: number, score2: number, pseudo1: string, pseudo2: string): string {
        if (pseudo1 === "waiting next round" || pseudo2 === "waiting next round") return '-';
        if (isNaN(score1)) return "Waiting result";
        if (!isNaN(score1) && isNaN(score2)) return "Result edited";
        if (!isNaN(score1) && !isNaN(score2)) return '' + score1;
    }

    public goToEditResult(item, editResult: IDialog) {
        let g: Game;
        // item est un objet formaté pour la vue => il faut chercher le Game correspondant.
        this.selectedTournament.games.forEach(game => {
            if (game.game_name === item.game_name) {
                g = game;
            }
        })
        if (g && this.canUpdateGame(g)){
            // avant d'ouvrir la boite de dialogue pour éditer le résultat, on vérifie que la personne connectée puisse bien le faire.
            editResult.show(g).subscribe((res) => {
                this.tournamentDisplayRounds();
                this.rounds.changes.subscribe(() => {
                    this.rounds.toArray().forEach(round => {
                        round.refresh();
                    });
                });
            });
        }
    }

    canUpdateGame(g: Game): Boolean {
        // le membre ne peut éditer le résultat d'un game si il n'y participe pas
        if (g.member1 !== this.authService.currentUser && g.member2 !== this.authService.currentUser) {
            this.snackbar.show("You can only edit your own game's results", 3000);
            return false;
        }
        // pas d'édition de résultat si un membre attends la fin d'une partie sur un tour (nombre de participants impair)
        if (g.member1 === "waiting next round" || g.member2 === "waiting next round") {
            this.snackbar.show("You don't play on this round", 3000);
            return false;
        }
        // si le score a été validé par les 2 participants, on ne peut plus le modifier
        if (! isNaN(g.memb1_score) && ! isNaN(g.memb2_score)) {
            this.snackbar.show("Edit's not possible when the score has been validated", 3000);
            return false;
        }
        // si le membre tente d'éditer un match alors que ceux du tour précédent (le sien et celui de son opposant) ne sont pas finis.
        if (!this.previousGamesFinished(g)) {
            this.snackbar.show("Both opponents have to finish their previous games", 3000);
            return false;
        }
        return true;
    }

    previousGamesFinished(g: Game): Boolean {
        let result = true;
        if (g.round > 1) { // si round === 1, pas de match précédent à contrôler...
            const previousRound = g.round - 1;
            const list = this.selectedTournament.games.sort((a, b) => { return a.round - b.round});
            const userLog = this.authService.currentUser;
            const currentOpponent = g.member1 === userLog ? g.member2 : g.member1;
            let previousGame;
            let previousGame2;
            for(let i = 0; i < list.length && list[i].round <= previousRound; ++i) {
                if (list[i].round === previousRound && (list[i].member1 === userLog || list[i].member2 === userLog)) {
                    // on a trouvé le match précédent du joueur
                    previousGame = list[i];
                }
                else if (list[i].round === previousRound && (list[i].member1 === currentOpponent || list[i].member2 === currentOpponent)) {
                    // on a trouvé le match précédent de l'adversaire
                    previousGame2 = list[i];
                }
            }
            if ((previousGame as Game) && (previousGame2 as Game)) {
                if ((!isNaN(previousGame.memb1_score) && !isNaN(previousGame.memb2_score)) || 
                    (previousGame.member1 === "waiting next round" || previousGame.member2 === "waiting next round")) {
                    // logique métier: si les 2 scores du match précédent sont sauvegardés en db => 
                    // le match précédent est fini donc le courant peut être édité.  
                    result = true;
                } else {
                    return false;
                }
                if ((!isNaN(previousGame2.memb1_score) && !isNaN(previousGame2.memb2_score)) || 
                    (previousGame2.member1 === "waiting next round" || previousGame2.member2 === "waiting next round")) {
                    // logique métier: si les 2 scores du match précédent sont sauvegardés en db => 
                    // le match précédent est fini donc le courant peut être édité.  
                    result = true;
                } else {
                    return false;
                }
            }
        }
        return result;
    }

    openRanking(ranking: IDialog) {
        ranking.show(this.selectedTournament).subscribe(() => {});
    }
}