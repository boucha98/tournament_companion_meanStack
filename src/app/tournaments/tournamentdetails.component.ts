import { Component, OnInit, ViewChild  } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { TournamentService, Tournament, Game } from "app/tournaments/tournament.service";
import { MemberService, Member } from "app/members/member.service";
import { SharedService } from "app/shared.service";
import { ColumnDef, MyTableComponent } from "app/mytable.component";
import { SnackBarComponent } from "app/snackbar.component";
import { Observable } from "rxjs/Observable";

import 'rxjs/add/operator/switchMap';
import { ObjectId } from 'bson';

@Component({
    selector: 'tournament',
    templateUrl: 'tournamentdetails.component.html',
    styleUrls: ['tournamentdetails.component.css']
})

export class TournamentDetailsComponent implements OnInit {
    tournament: Tournament;
    selectedMemberNotAssigned: Member;
    selectedMemberAssigned: Member;
    membersNotAssignedList: Member[];
    
    // public message: string;
    
    @ViewChild('membersAssigned') membersAssigned: MyTableComponent;
    @ViewChild('membersNotAssigned') membersNotAssigned: MyTableComponent;
    @ViewChild('snackbar') snackbar: SnackBarComponent;

    assignedColumnDefs: ColumnDef[] = [
        { name: 'pseudo', type: 'String', header: 'Pseudo', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'profile', type: 'String', header: 'Profile', width: 2, filter: true },
        { name: 'birthdate', type: 'Date', header: 'Birth Date', width: 1, filter: true, align: 'center' },
    ];
    notAssignedColumnDefs: ColumnDef[] = [
        { name: 'pseudo', type: 'String', header: 'Pseudo', width: 1, key: true, filter: true, sort: 'asc' },
        { name: 'profile', type: 'String', header: 'Profile', width: 2, filter: true },
        { name: 'birthdate', type: 'Date', header: 'Birth Date', width: 1, filter: true, align: 'center' },
    ];

    constructor(
        private tournamentService: TournamentService, 
        private memberService: MemberService,
        private sharedService: SharedService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        // gestion des besoins de refresh des listes de Member initiés par des composants indépendants (exemple: boite modale tournament-subscribe)
        this.sharedService.toUpdate.subscribe(needUpdate => {
            if(needUpdate === true) {
                this.tournamentService.getOne(this.tournament.name).subscribe((t: Tournament) => {
                    this.initDataLists(t);
                });
                this.sharedService.publishUpdateStatus(false); // on repasse la valeur à false pour arrêter la demande d'update.
            }
        });
    }

    ngOnInit() {
        this.route.params
            .switchMap((params: ParamMap) => this.tournamentService.getOne(params['name']))
            .subscribe((t: Tournament) => {
                this.initDataLists(t);
            });
    }

    initDataLists(t: Tournament) {
        this.memberService.getAllNotAssigned(t._id).subscribe((res: Member[]) => { 
            this.membersNotAssignedList = res;
            // on assigne this.tournament ici et non dans le premier subscribe sinon la liste ne sera pas prête à temps pour le getDataServiceNotAssigned()
            this.tournament = t; 
            if (this.membersAssigned && this.membersNotAssigned) this.clear();
        })
    }

    get getDataServiceAssigned() {
        return m => Observable.of(this.tournament ? this.tournament.members : null);
    }
    // on fournit un tableau et non la méthode/query de member.service => éviter trop d'aller - retour d'informations depuis le serveur
    get getDataServiceNotAssigned() {
        return m => Observable.of(this.membersNotAssignedList ? this.membersNotAssignedList : null);
    }
    
    assignMember() {
        if(!this.areEnoughPlaces(1)) {
            this.snackbar.show("Failed: No place available", 3000);
            // this.message = "Failed: No place available.";
        }
        // A VOIR: sécurité --> contrôler si membre ou tournament déjà dans listes correspondantes des objets avant de push() 
        else if(this.selectedMemberNotAssigned && !this.tournament.closed) {
            // update de la liste des tournois du membre sélectionné
            this.selectedMemberNotAssigned.tournaments.push(this.tournament);
            this.memberService.update(this.selectedMemberNotAssigned).subscribe((res) => {console.log(res)});
            // update de la liste des membres du tournoi affiché
            this.tournament.members.push(this.selectedMemberNotAssigned);
            this.tournamentService.update(this.tournament).subscribe((res) => {console.log(res)});

            this.removeMembersFromArray(this.membersNotAssignedList, [this.selectedMemberNotAssigned]); // on retire le membre de la liste notAssigned
            
            this.clear();
        } 
    }

    assignAllMembers() {
        if(!this.areEnoughPlaces(this.membersNotAssignedList.length)) {
            this.snackbar.show("Failed: Not enough places available", 3000);
            // this.message = "Failed: Not enough places available.";
        }
        else if(this.membersNotAssignedList.length > 0 && !this.tournament.closed) { // lancer seulement si il y a des membres non assignés
            this.addMembersFromArray(this.tournament.members, this.membersNotAssignedList);
            this.tournamentService.update(this.tournament).subscribe((res) => console.log(res));
    
            this.membersNotAssignedList.forEach((member) => { 
                member.tournaments.push(this.tournament);
                this.memberService.update(member).subscribe((res) => {console.log(res)});
            })
            this.membersNotAssignedList = [];
            
            this.clear();
        }
    }

    unassignMember() {
        if (this.selectedMemberAssigned && !this.tournament.closed) {
            // update de la liste des tournois du membre
            let index = -1
            for(let i = 0; i < this.selectedMemberAssigned.tournaments.length && i !== index; ++i) {
                let tId = this.selectedMemberAssigned.tournaments[i].toString()
                if (tId === this.tournament._id) index = i;
            }
            if (index > -1) {
                this.selectedMemberAssigned.tournaments.splice(index, 1);
                this.memberService.update(this.selectedMemberAssigned).subscribe(res => {console.log(res)});
            }
            
            // update de la liste des membres du tournoi affiché
            const action = this.removeMembersFromArray(this.tournament.members, [this.selectedMemberAssigned]);
            if( action === true ) {
                this.tournamentService.update(this.tournament).subscribe((res) => {console.log(res)});
            }
            this.addMembersFromArray(this.membersNotAssignedList, [this.selectedMemberAssigned]); // on ajoute le membre dans la liste notAssigned
            
            this.clear();
        }
    }

    unassignAllMembers() { 
        if(this.tournament.members.length > 0 && !this.tournament.closed) { // lancer seulement si il y a des membres assignés
            this.addMembersFromArray(this.membersNotAssignedList, this.tournament.members);
            this.tournament.members.forEach(member => {
                let index = -1;
                for(let i = 0; i < member.tournaments.length && index !== i; ++i) {
                    let tId = member.tournaments[i].toString();
                    if (tId === this.tournament._id) index = i;
                }
                if( index > -1 ) {
                    member.tournaments.splice(index, 1);
                    this.memberService.update(member).subscribe((res) => {console.log(res)});
                }
            });

            this.tournament.members = [];
            this.tournamentService.update(this.tournament).subscribe((res) => {console.log(res)});

            this.clear();
        }
    }

    public selectedItemChangedNotAssigned(item) {
        this.selectedMemberNotAssigned = this.membersNotAssigned.selectedItem as Member;
    }
    
    public selectedItemChangedAssigned(item) {
        this.selectedMemberAssigned = this.membersAssigned.selectedItem as Member;
    }
    // true s'il reste suffisamment de places.
    areEnoughPlaces(numberToAssign: number) {
        return numberToAssign + this.tournament.members.length <= this.tournament.maxPlayers;
    }

    removeMembersFromArray(originList: Member[], toDelete: Member[]) {
        for (let i = originList.length - 1; i >= 0; i--) {
            let m = originList[i];
        
            if (toDelete.indexOf(m) !== -1) {
                originList.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    addMembersFromArray(originList: Member[], toAdd: Member[]) {
        for (let i = 0; i < toAdd.length; ++i) {
            let m = toAdd[i];
            let control = originList.indexOf(m);
            if(control === -1) originList.push(m);
        }
    }

    clear() {
        this.selectedMemberAssigned = null;
        this.selectedMemberNotAssigned = null;
        this.membersAssigned.refresh();
        this.membersNotAssigned.refresh();
        // this.message = "";
    }

    gamesCreation() {
        if (this.tournament.closed) return; // sécurité
        // création des matchs basée sur un algorithme cyclique: https://en.wikipedia.org/wiki/Round-robin_tournament#Scheduling_algorithm 
        let list: Member[] = [];
        this.tournament.members.forEach(m => { list.push(m); });
        
        if (list.length%2 !== 0) {
            // ajout d'un pseudo-membre si nombre de membres impair ("waiting..." dans console.log)
            list.push(new Member({pseudo: "waiting next round", password: "waiting next round"})); 
        }
        let nbServerRes = 0; // comptabiliser les réponses du serveur pour la création en db des games => si tous sont créés, on affiche un message info
        const nbRound = list.length - 1; // nombre de tours pour ce tournoi
        const half = list.length / 2; // nombre de matchs par tour
        for(let round = 0; round < nbRound; ++round) {
            // console.log("Round: " + (round + 1));
            for(let game = 0; game < half; ++game) {
                let player1: Member = list[(round + game) % nbRound];
                let player2: Member = list[(round + nbRound - game) % nbRound];
                if (game === 0) {
                    player2 = list[nbRound];
                }
                // code ci-dessous pour affichage dans la console (jusqu'à ligne 233)
                // if (player1.pseudo !== "waiting next round" && player2.pseudo !== "waiting next round"){
                //     console.log(player1.pseudo + " vs " + player2.pseudo);
                // } else {
                //     if (player1.pseudo !== "waiting next round") console.log(player1.pseudo + " waiting next round");
                //     else console.log(player2.pseudo + " waiting next round");
                // }
                
                let newGame = new Game({ 
                    game_name: this.tournament.name+"-round"+(round+1)+"-game"+(game+1), 
                    member1: player1.pseudo, 
                    member2: player2.pseudo, 
                    round: (round+1), 
                    tournament: this.tournament 
                });
                this.tournamentService.addGame(this.tournament, newGame).subscribe(res => {
                    if (res) {
                        ++nbServerRes;
                        this.tournament.games.push(res);
                    } 
                }, err => {
                    console.log(err)
                }, () => {
                    if (nbServerRes === nbRound*half) {
                        this.snackbar.show("All games have been created", 3000);
                        // this.message = "All games have been created";
                        this.tournament.closed = true;
                        this.tournamentService.update(this.tournament).subscribe(res => { if(res) console.log('Subscriptions closed.')});
                    }
                });
            }
        }
    }
}