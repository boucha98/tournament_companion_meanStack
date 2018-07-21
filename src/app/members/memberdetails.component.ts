import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MemberService, Member } from "app/members/member.service";
import { Observable } from "rxjs/Observable";

import 'rxjs/add/operator/switchMap';

@Component({
    selector: 'member',
    templateUrl: 'memberdetails.component.html'
})

export class MemberDetailsComponent implements OnInit {
    public member: Member;
    
    constructor(
        private service: MemberService, 
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit() {
        
        this.route.params
            .switchMap((params: ParamMap) => this.service.getOne(params['pseudo']))
            .subscribe((t: Member) => this.member = t);           
    }
}