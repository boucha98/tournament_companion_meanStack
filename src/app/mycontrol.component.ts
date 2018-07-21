import { AfterViewInit, OnChanges, Input, ElementRef, SimpleChanges } from "@angular/core";
import { ControlValueAccessor, Validator, FormControl, AbstractControl } from "@angular/forms";
import { ValidationService } from "app/validation.service";

// see: https://github.com/angular/angular/issues/10036
export abstract class MyControlComponent implements AfterViewInit, OnChanges, ControlValueAccessor, Validator {

    @Input() label: string = "<label>";
    @Input() prefix: string;
    @Input() formControlName: string;
    @Input() focus: boolean = false;
    @Input() readonly: boolean = false;

    protected static uniqueId: number = 0;
    public id: string;
    protected innerValue: any;
    // the control to which this custom control is bound to
    public outerControl: FormControl;   
    protected propagateChange = (_: any) => { };

    constructor(private messageSvc: ValidationService, private elem: ElementRef) {
        // give a unique id (used for the label for="...")
        this.id = elem.nativeElement.tagName.toLowerCase() + '_' + MyControlComponent.uniqueId++;
    }

    registerOnValidatorChange(fn: () => void): void {
    }

    get value(): any {
        return this.innerValue;
    }

    set value(value: any) {
        this.innerValue = value;
        this.propagateChange(this.innerValue);
    }

    writeValue(obj: any): void {
        this.innerValue = obj;
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void { }

    setDisabledState(isDisabled: boolean): void { }

    ngAfterViewInit(): void {
    }

    ngOnChanges(changes: SimpleChanges): void {
    }

    public abstract setFocus(select?: boolean);

    // credits: https://coryrylan.com/blog/angular-form-builder-and-validation-management
    get errorMessages(): string[] {
        let errors = [];
        var key = this.prefix ? this.prefix + '.' : '';
        for (let propertyName in this.outerControl.errors) {
            if (this.outerControl.errors.hasOwnProperty(propertyName)) {
                errors.push(this.messageSvc.getValidatorErrorMessage(key + propertyName, this.outerControl.errors[propertyName]));
            }
        }
        return errors;
    }

    validate(c: AbstractControl): { [key: string]: any; } {
        /* Some kind of hack to get a reference to the bound host FormControl.
         * Easier than using @Host() private outerFormGroup: FormGroupDirective in the constructor
         * and then search the bound control within the hierarchy of children of the group (which is always the root).
         */
        if (!this.outerControl)
            this.outerControl = c as FormControl;
        return null;
    }
}
