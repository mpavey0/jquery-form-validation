/**
 * jQuery Form Validation
 *
 * @author Tom Bertrand
 * @version 1.0.1 (2014-05-23)
 *
 * @copyright
 * Copyright (C) 2014 Tom Bertrand.
 *
 * @link
 * http://www.runningcoder.org/jqueryvalidation/
 *
 * @license
 * Licensed under the MIT license.
 */
(function (window, document, $, undefined)
{

    window.Validation = {};

    // Not using strict to avoid throwing a window error on bad config extend.
    // console.debug is used instead to debug Validation
    //"use strict";

    // =================================================================================================================
    /**
     * @private
     * RegExp rules
     */
    var _rules = {
        // Validate not empty
        NOTEMPTY: /./,
        // Validate a numeric
        NUMERIC: /^[0-9]+$/,
        // Validate an alphanumeric string (no special chars)
        MIXED: /^[\w\s-]+$/,
        // Validate a spaceless string
        NOSPACE: /^[^\s]+$/,
        // Validate a spaceless string at start or end
        TRIM: /^[^\s].*[^\s]$/,
        // Validate a date YYYY-MM-DD
        DATE: /^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}(:\d{2})?)?$/,
        // Validate an email
        EMAIL: /^([^@]+?)@(([a-z0-9]-*)*[a-z0-9]+\.)+([a-z0-9]+)$/i,
        // Validate an url
        URL: /^(https?:\/\/)?((([a-z0-9]-*)*[a-z0-9]+\.?)*([a-z0-9]+))(\/[\w?=\.-]*)*$/,
        // Validate a north american phone number
        PHONE: /^(\()?\d{3}(\))?(-|\s)?\d{3}(-|\s)\d{4}$/,
        // Validate value if it is not empty
        OPTIONAL: /^.*$/,
        // Validate values or length by comparison
        COMPARISON: /^\s*([LV])\s*([<>]=?|==|!=)\s*([^<>=!]+?)\s*$/
    };

    /**
     * @private
     * Error messages
     */
    var _message = {
        'default': '$ contain error(s).',
        'NOTEMPTY': '$ must not be empty.',
        'NUMERIC': '$ must be numeric.',
        'STRING': '$ must be a string.',
        'NOSPACE': '$ must not contain spaces.',
        'TRIM': '$ must not start or end with space character.',
        'MIXED': '$ must be letters or numbers (no special characters).',
        'DATE': '$ is not a valid with format YYYY-MM-DD.',
        'EMAIL': '$ is not valid.',
        'URL': '$ is not valid.',
        'PHONE': '$ is not a valid phone number.',
        //'INARRAY': '$ is not a valid option.',
        '<': '$ must be less than % characters.',
        '<=': '$ must be less or equal to % characters.',
        '>': '$ must be greater than % characters.',
        '>=': '$ must be greater or equal to % characters.',
        '==': '$ must be equal to %',
        '!=': '$ must be different than %'
    };

    /**
     * @private
     * HTML5 data attributes
     */
    var _data = {
        validation: 'data-validation',
        validationMessage: 'data-validation-message',
        regex: 'data-validation-regex',
        regexMessage: 'data-validation-regex-message',
        validationGroup: 'data-validation-group',
        errorList: 'data-error-list'
    };

    /**
     * @private
     * Default options
     *
     * @link http://www.runningcoder.org/jqueryvalidation/documentation/
     */
     var _options = {
         submit: {
             settings: {
                 form: null,
                 display: "inline",
                 insertion: "append",
                 allErrors: false,
                 trigger: "click",
                 button: "input[type='submit']",
                 errorClass: "error",
                 errorListClass: "error-list",
                 inputContainer: null,
                 clear: "focusin"
             },
             callback: {
                 onInit: null,
                 onValidate: null,
                 onError: null,
                 onBeforeSubmit: null,
                 onSubmit: null,
                 onAfterSubmit: null
             }
         },
         dynamic: {
             settings: {
                 trigger: null,
                 delay: 300
             },
             callback: {
                 onSuccess: null,
                 onError: null,
                 onComplete: null
             }
         }
     };

    /**
     * @private
     * Limit the supported options on matching keys
     */
    var _supported = {
        submit: {
            settings: {
                display: ["inline", "block"],
                insertion: ["append", "prepend"], //"before", "insertBefore", "after", "insertAfter"
                allErrors: [true, false],
                clear: ["focusin", "keypress", false],
                trigger: [
                    "click", "dblclick", "focusout",
                    "hover", "mousedown", "mouseenter", 
                    "mouseleave", "mousemove", "mouseout",
                    "mouseover", "mouseup", "toggle"
                ]
            }
        },
        dynamic: {
            settings: {
                trigger: ["focusout", "keydown", "keypress", "keyup"]
            }
        }
    };

    /**
     * Fail-safe preventExtensions function for older browsers
     */
    if (typeof Object.preventExtensions !== "function") {
        Object.preventExtensions = function (obj) { return obj; }
    }

    // =================================================================================================================

    /**
     * @constructor
     * Validation Class
     *
     * @param {object} node jQuery form object
     * @param {object} options User defined options
     */
    var Validation = function (node, options) {

        var errors = [];

        /**
         * Extends user-defined "options" into the default Validation "_options".
         * Notes:
         *  - preventExtensions prevents from modifying the Validation "_options" object structure
         *  - filter through the "_supported" to delete unsupported "options"
         */
        function extendOptions () {

            if (!(options instanceof Object)) {
                options = {};
            }

            var tpmOptions = Object.preventExtensions($.extend(true, {}, _options));

            for (var method in options) {
                if (!options.hasOwnProperty(method) || !(options[method] instanceof Object)) {
                    continue;
                }

                for (var type in options[method]) {
                    if (!options[method].hasOwnProperty(type) || !(options[method][type] instanceof Object)) {
                        continue;
                    }

                    for (var option in options[method][type]) {
                        if (!options[method][type].hasOwnProperty(option)) {
                            continue;
                        }

                        if (_supported[method] &&
                            _supported[method][type] &&
                            _supported[method][type][option] &&
                            $.inArray(options[method][type][option], _supported[method][type][option]) === -1) {

                            window.debug(
                                'Validation.extendOptions - Delete unsupported property - ' + type +
                                ': {' + option.toString() + ': ' + options[method][type][option].toString() + '}'
                            );

                            delete options[method][type][option];
                        }

                    }
                    if (tpmOptions[method] && tpmOptions[method][type]) {
                        tpmOptions[method][type] = $.extend(Object.preventExtensions(tpmOptions[method][type]), options[method][type]);
                    }
                }
            }

            // @TODO Would there be a better fix to solve event conflict?
            if (tpmOptions.dynamic.settings.trigger) {
                if (tpmOptions.dynamic.settings.trigger === "keypress" && tpmOptions.submit.settings.clear === "keypress") {
                    tpmOptions.dynamic.settings.trigger = "keydown";
                }
            }

            options = tpmOptions;

        }

        /**
         * Delegates the dynamic validation on data-validation and data-validation-regex attributes based on trigger.
         *
         * @returns {boolean} false if the option is not set
         */
        function delegateDynamicValidation() {

            if (!options.dynamic.settings.trigger) {
                return false;
            }

            $.each(
                $(node).find('[' + _data.validation + ']:not([disabled]),[' + _data.regex + ']:not([disabled])'),
                function (index, input) {

                    $(input).unbind(options.dynamic.settings.trigger).on(options.dynamic.settings.trigger, function (e) {

                        //e.preventDefault();

                        var input = this;

                        _typeWatch(function () {

                            if (!validateInput(input)) {

                                displayOneError(input.name);
                                _executeCallback(options.dynamic.callback.onError, [node, input, errors[input.name]]);

                            } else {

                                _executeCallback(options.dynamic.callback.onSuccess, [node, input]);

                            }

                            _executeCallback(options.dynamic.callback.onComplete, [node, input]);

                        }, options.dynamic.settings.delay);

                    });
                }
            )
        }

        var _typeWatch = (function(){
            var timer = 0;
            return function(callback, ms){
                clearTimeout (timer);
                timer = setTimeout(callback, ms);
            }
        })();

        /**
         * Delegates the submit validation on data-validation and data-validation-regex attributes based on trigger.
         * Note: Disable the form submit function so the callbacks are not by-passed
         */
        function delegateValidation () {

            _executeCallback(options.submit.callback.onInit, [node]);

            $(node).on("submit", false );
            $(node).find(options.submit.settings.button).unbind(options.submit.settings.trigger).on(options.submit.settings.trigger, function (e) {

                e.preventDefault();

                resetErrors();

                _executeCallback(options.submit.callback.onValidate, [node]);

                if (!validateForm()) {

                    // OnError function receives the "errors" object as the last "extraParam"
                    _executeCallback(options.submit.callback.onError, [node, errors]);

                    displayErrors();

                } else {

                    _executeCallback(options.submit.callback.onBeforeSubmit, [node]);

                    (options.submit.callback.onSubmit) ? _executeCallback(options.submit.callback.onSubmit, [node]) : submitForm();

                    _executeCallback(options.submit.callback.onAfterSubmit, [node]);

                }

                return false;

            });

        }

        /**
         * For every "data-validation" & "data-pattern" attributes that are not disabled inside the jQuery "node" object
         * the "validateInput" function will be called.
         *
         * @returns {boolean} true if no error(s) were found (valid form)
         */
        function validateForm () {

            $.each(
                $(node).find('[' + _data.validation + ']:not([disabled]),[' + _data.regex + ']:not([disabled])'),
                function (index, input) {

                    validateInput(input);

                }
            );

            return $.isEmptyObject(errors);

        }

        /**
         * Prepare the information from the data attributes
         * and call the "validateRule" function.
         *
         * @param {object} input Reference of the input element
         *
         * @returns {boolean} true if no error(s) were found (valid input)
         */
        function validateInput (input) {

            var inputName = $(input).attr('name');

            if (!inputName) {
                window.debug('Validation.validateInput - Invalid {string} inputName on ' + input.toString());
                return false;
            }

            var value = _getInputValue(input),

                matches = inputName.replace(/]$/, '').split(/]\[|[[\]]/g),
                inputShortName = matches[matches.length - 1],

                validationArray = $(input).attr(_data.validation),
                validationMessage = $(input).attr(_data.validationMessage),
                validationRegex = $(input).attr(_data.regex),
                validationRegexMessage = $(input).attr(_data.regexMessage),

                validateOnce = false;

            if (validationArray) {
                validationArray = _api._splitValidation(validationArray);
            }

            // Validates the "data-validation"
            if (!$.isEmptyObject(validationArray)) {

                // "OPTIONAL" input will not be validated if it's empty
                if (value === '' && $.inArray('OPTIONAL', validationArray) !== -1) {
                    return true;
                }

                $.each(validationArray, function (i, rule) {

                    if (validateOnce === true) {
                        return true;
                    }

                    try {

                        validateRule(value, rule);

                    } catch (error) {

                        if (validationMessage || !options.submit.settings.allErrors) {
                            validateOnce = true;
                        }

                        error[0] = validationMessage || error[0];

                        registerError(inputName, error[0].replace('$', inputShortName).replace('%', error[1]));

                    }

                });

            }

            // Validates the "data-validation-regex"
            if (validationRegex) {

                var pattern = validationRegex.split('/');

                if (pattern.length > 1) {

                    var tmpPattern = "";

                    // Do not loop through the last item knowing its a potential modifier
                    for (var k = 0; k < pattern.length - 1; k++) {
                        if (pattern[k] !== "") {
                            tmpPattern += pattern[k] + '/';
                        }
                    }
                    // Remove last added "/"
                    tmpPattern = tmpPattern.slice(0, -1);

                    // Test the last item for modifier(s)
                    if (/[gimsxeU]+/.test(pattern[pattern.length - 1])) {
                        var patternModifier = pattern[pattern.length - 1];
                    }

                    pattern = tmpPattern;
                } else {
                    pattern = pattern[0];
                }

                // Validate the regex
                try {

                    var rule = new RegExp(pattern, patternModifier);

                } catch (error) {

                    window.debug('Invalid data-validation-regex on ' + inputName);
                    return true;

                }

                try {

                    validateRule(value, rule);

                } catch (error) {

                    error[0] = validationRegexMessage || error[0];

                    registerError(inputName, error[0].replace('$', inputShortName));

                }

            }

            return $.isEmptyObject(errors[inputName]);

        }

        /**
         * Validate an input value against one rule.
         * If a "value-rule" mismatch occurs, an error is thrown to the caller function.
         *
         * @param {string} value
         * @param rule
         *
         * @returns {*} Error if a mismatch occurred.
         */
        function validateRule (value, rule) {

            // Validate for custom "data-validation-regex"
            if (rule instanceof RegExp) {
                if (rule.test(value)) {
                    throw [_message['default'], ''];
                }
                return;
            }

            // Validate for predefined "data-validation" _rules
            if (_rules[rule]) {
                if (!_rules[rule].test(value)) {
                    throw [_message[rule], ''];
                }
                return;
            }

            // Validate for comparison "data-validation"
            var comparison = rule.match(_rules['COMPARISON']);
            if (!comparison || comparison.length !== 4) {
                window.debug('Validation.validateRule - Invalid validation rule: ' + rule);
                return;
            }

            var type = comparison[1],
                operator = comparison[2],
                compared = comparison[3],
                comparedValue;

            switch (type) {

                // Compare input "Length"
                case "L":

                    if (isNaN(compared)) {

                        comparedValue = $(node).find('[name="' + compared + '"]').val();
                        if (!comparedValue) {
                            window.debug('$.Validation.validateRule - Unable to find value of input[name="' + compared + '"] inside rule ' + rule)
                            return false;
                        }

                        if (!value || !eval('"' + encodeURIComponent(value) + '"' + operator + '"' + encodeURIComponent(comparedValue) + '"')) {
                            throw [_message[operator], compared];
                        }

                    } else {

                        if (!value || eval(value.length + operator + parseFloat(compared)) == false) {
                            throw [_message[operator], compared];
                        }

                    }
                    break;

                // Compare input "Value"
                case "V":
                default:

                    if (isNaN(compared)) {

                        comparedValue = $(node).find('[name="' + compared + '"]').val();
                        if (!comparedValue) {
                            window.debug('$.Validation.validateRule - Unable to find value of input[name="' + compared + '"] inside rule ' + rule)
                            return false;
                        }

                        if (!value || !eval('"' + encodeURIComponent(value) + '"' + operator + '"' + encodeURIComponent(comparedValue) + '"')) {
                            throw [_message[operator].replace(' characters', ''), compared];
                        }

                    } else {

                        if (!value || !eval(value + operator + parseFloat(compared))) {
                            throw [_message[operator].replace(' characters', ''), compared];
                        }

                    }
                    break;

            }

        }

        /**
         * Register an error into the global "error" variable.
         *
         * @param {string} inputName Input where the error occurred
         * @param {string} error Description of the error to be displayed
         */
        function registerError (inputName, error) {

            if (!errors[inputName]) {
                errors[inputName] = [];
            }

            errors[inputName].push(error.capitalize());

        }

        /**
         * Display a single error based on "inputName" key inside the "errors" global array.
         * The input, the label and the "inputContainer" will be given the "errorClass" and other
         * settings will be considered.
         *
         * @param {string} inputName Key used for search into "errors"
         *
         * @returns {boolean} false if an unwanted behavior occurs
         */
        function displayOneError (inputName) {

            var input,
                inputId,
                errorContainer,
                label,
                html = '<div class="' + options.submit.settings.errorListClass + '" ' + _data.errorList + '><ul></ul></div>',
                group,
                groupInput;

            if (!errors.hasOwnProperty(inputName)) {
                return false;
            }

            input = $(node).find('[name="' + inputName + '"]');

            label = null;

            if (!input[0]) {
                window.debug('Validation.displayOneError unable to find ' + inputName);
                return false;
            }

            group = input.attr(_data.validationGroup);

            if (group) {

                groupInput = $(node).find('[name="' + inputName + '"]');
                label = $(node).find('[id="' + group + '"]');

                if (label[0]) {
                    label.addClass(options.submit.settings.errorClass);
                    errorContainer = label;
                }

                //$(node).find('[' + _data.validationGroup + '="' + group + '"]').addClass(options.submit.settings.errorClass)

            } else {

                input.addClass(options.submit.settings.errorClass);

                if (options.submit.settings.inputContainer) {
                    input.parentsUntil(node, options.submit.settings.inputContainer).addClass(options.submit.settings.errorClass)
                }

                inputId = input.attr('id');

                if (inputId) {
                    label = $(node).find('label[for="' + inputId + '"]')[0];
                }

                if (!label) {
                    label = input.parentsUntil(node, 'label')[0];
                }

                if (label) {
                    label = $(label);
                    label.addClass(options.submit.settings.errorClass);
                }
            }

            if (options.submit.settings.display === 'inline') {
                errorContainer = errorContainer || input.parent();
            } else if (options.submit.settings.display === 'block') {
                errorContainer = $(node);
            }

            if (options.submit.settings.display === "inline" ||
                (options.submit.settings.display === "block" && !errorContainer.find('[' + _data.errorList + ']')[0])
            ) {
                if (options.submit.settings.insertion === 'append') {
                    errorContainer.append(html);
                } else if (options.submit.settings.insertion === 'prepend') {
                    errorContainer.prepend(html);
                }
            }

            for (var i = 0; i < errors[inputName].length; i++) {
                errorContainer.find('ul').append('<li>' + errors[inputName][i] + '</li>');
            }

            if (options.submit.settings.clear || options.dynamic.settings.trigger) {

                if (group && groupInput) {
                    input = groupInput;
                }

                input.unbind(options.submit.settings.clear)
                    .on(options.submit.settings.clear + " " + options.dynamic.settings.trigger, function (a,b,c,d,e) {

                        return function () {

                            if (e) {

                                if ($(c).hasClass(options.submit.settings.errorClass)) {
                                    resetOneError(a,b,c,d,e);
                                }

                            } else if ($(b).hasClass(options.submit.settings.errorClass)) {
                                resetOneError(a,b,c,d);
                            }
                        };

                    }(inputName, input, label, errorContainer, group))
            }

        }

        /**
         * Display all of the errors
         */
        function displayErrors () {

            for (var inputName in errors) {
                displayOneError(inputName);
            }

            if (options.submit.settings.display === 'block') {
                if (typeof $.scrollTo === 'function') {
                    $.scrollTo(node, 500, { offset: -100 });
                }
            }

        }

        /**
         * Remove an input error.
         *
         * @param {string} inputName Key reference to delete the error from "errors" global variable
         * @param {object} input jQuery object of the input
         * @param {object} label jQuery object of the input's label
         * @param {object} container jQuery object of the "errorList"
         * @param {string} [group] Name of the group if any (ex: used on input radio)
         */
        function resetOneError(inputName, input, label, container, group) {

            try {
                delete errors[inputName];
            } catch(error) {
                window.debug('Validation.resetOneError unable to find and delete ' + inputName + ' inside {object} errors.');
                return false;
            }

            if (options.submit.settings.inputContainer) {
                (group ? label : input).parentsUntil(node, options.submit.settings.inputContainer).removeClass(options.submit.settings.errorClass)
            }

            label && label.removeClass(options.submit.settings.errorClass);

            input.removeClass(options.submit.settings.errorClass);

            if (options.submit.settings.display === 'inline') {
                container.find('[' + _data.errorList + ']').remove();
            }

        }

        /**
         * Remove all of the input error(s) display.
         */
        function resetErrors () {

            errors = [];

            $(node).find('[' + _data.errorList + ']').remove();
            $(node).find('.' + options.submit.settings.errorClass).removeClass(options.submit.settings.errorClass);

        }

        /**
         * Submits the form once it succeeded the validation process.
         * Note: This function will be overridden if "options.submit.settings.onSubmit" is defined
         */
        function submitForm () {

            node.submit();

        }

        /**
         * @private
         * Helper to get the value of an regular, radio or chackbox input
         *
         * @param input
         *
         * @returns {string} value
         */
        var _getInputValue = function (input) {

            var value;

            // Get the value or state of the input based on its type
            switch ($(input).attr('type')) {
                case 'checkbox':
                    value = ($(input).is(':checked')) ? 1 : '';
                    break;
                case 'radio':
                    value = $(node).find('input[name="' + $(input).attr('name') + '"]:checked').val() || '';
                    break;
                default:
                    value = $(input).val();
                    break;
            }

            return value;

        };

        /**
         * @private
         * Executes an anonymous function or a string reached from the window scope.
         *
         * @example
         * Note: These examples works with every callbacks (onInit, onError, onSubmit, onBeforeSubmit & onAfterSubmit)
         *
         * // An anonymous function inside the "onInit" option
         * onInit: function() { console.log(':D'); };
         *
         * * // myFunction() located on window.coucou scope
         * onInit: 'window.coucou.myFunction'
         *
         * // myFunction(a,b) located on window.coucou scope passing 2 parameters
         * onInit: ['window.coucou.myFunction', [':D', ':)']];
         *
         * // Anonymous function to execute a local function
         * onInit: function () { myFunction(':D'); }
         *
         * @param {string|array} callback The function to be called
         * @param {array} [extraParams] In some cases the function can be called with Extra parameters (onError)
         *
         * @returns {boolean}
         */
        var _executeCallback = function (callback, extraParams) {

            if (!callback) {
                return false;
            }

            var _callback;

            if (typeof callback === "function") {

                _callback = callback;

            } else if (typeof callback === "string" || callback instanceof Array) {

                _callback = window;

                if (typeof callback === "string") {
                    callback = [callback, []];
                }

                var _exploded = callback[0].split('.'),
                    _params = callback[1],
                    _isValid = true,
                    _splitIndex = 0;

                while (_splitIndex < _exploded.length) {

                    if (typeof _callback !== 'undefined') {
                        _callback = _callback[_exploded[_splitIndex++]];
                    } else {
                        _isValid = false;
                        break;
                    }
                }

                if (!_isValid || typeof _callback !== "function") {
                    window.debug('Validation._executeFunction - Invalid function - ' + callback[0].toString());
                    return false;
                }

            }

            _callback.apply(this, $.merge(_params || [], (extraParams) ? extraParams : []));
            return true;

        };

        /**
         * @private
         * Constructs Validation
         */
        this.__construct = function () {

            extendOptions();

            delegateDynamicValidation();
            delegateValidation();

        }();

        return {

            /**
             * @public
             * Register error
             *
             * @param inputName
             * @param error
             */
            registerError: registerError,

            /**
             * @public
             * Display one error
             *
             * @param inputName
             */
            displayOneError: displayOneError,

            /**
             * @public
             * Display all errors
             */
            displayErrors: displayErrors

        };

    };

    // =================================================================================================================

    /**
     * @public
     * jQuery public function to implement the Validation on the selected node(s).
     *
     * @param {object} options To configure the Validation class.
     *
     * @return {object} Modified DOM element
     */
    $.fn.validate = $.validate = function (options) {

        return _api.validate(this, options);

    };

    /**
     * @public
     * jQuery public function to add one or multiple "data-validation" argument.
     *
     * @param {string|array} validation Arguments to add in the node's data-validation
     *
     * @return {object} Modified DOM element
     */
    $.fn.addValidation = function (validation) {

        return _api.addValidation(this, validation);

    };

    /**
     * @public
     * jQuery public function to remove one or multiple "data-validation" argument.
     *
     * @param {string|array} validation Arguments to remove in the node's data-validation
     *
     * @return {object} Modified DOM element
     */
    $.fn.removeValidation = function (validation) {

        return _api.removeValidation(this, validation);

    };

    /**
     * @public
     * jQuery public function to add one or multiple errors.
     *
     * @param {object} error Object of errors where the keys are the input names
     * @example
     * $('form#myForm').addError({
     *     'username': 'Invalid username, please choose another one.'
     * });
     *
     * @return {object} Modified DOM element
     */
    $.fn.addError = function (error) {

        return _api.addError(this, error);

    };

    // =================================================================================================================

    /**
     * @private
     * API to handles "addValidation" and "removeValidation" on attribute "data-validation".
     * Note: Contains fail-safe operations to unify the validation parameter.
     *
     * @example
     * $.addValidation('NOTEMPTY, L>=6')
     * $.addValidation('[notempty, v>=6]')
     * $.removeValidation(['OPTIONAL', 'V>=6'])
     *
     * @returns {object} Updated DOM object
     */
    var _api = {

        /**
         * @private
         * This function unifies the data through the validation process.
         * String, Uppercase and spaceless.
         *
         * @param {string|array} validation
         *
         * @returns {string}
         */
        _formatValidation: function (validation) {

            validation = validation.toString().replace(/\s/g, '');

            if (validation.charAt(0) === "[" && validation.charAt(validation.length - 1) === "]") {
                validation = validation.replace(/^\[|\]$/g, '');
            }

            return validation;

        },

        /**
         * @private
         * Splits the validation into an array, Uppercase the rules if they are not comparisons
         *
         * @param {string|array} validation
         *
         * @returns {array} Formatted validation keys
         */
        _splitValidation: function (validation) {

            var validationArray = this._formatValidation(validation).split(','),
                oneValidation;

            for (var i = 0; i < validationArray.length; i++) {
                oneValidation = validationArray[i];
                if (/^[a-z]+$/i.test(oneValidation)) {
                    validationArray[i] = oneValidation.toUpperCase();
                }
            }

            return validationArray;
        },

        /**
         * @private
         * Joins the validation array to create the "data-validation" value
         *
         * @param {array} validation
         *
         * @returns {string}
         */
        _joinValidation: function (validation) {

            return '[' + validation.join(', ') + ']';

        },

        /**
         * API method to attach the submit event type on the specified node.
         * Note: Clears the previous event regardless to avoid double submits or unwanted behaviors.
         *
         * @param {object} node jQuery object(s)
         * @param {object} options To configure the Validation class.
         *
         * @returns {*}
         */
        validate: function (node, options) {

            if (typeof node === "function") {

                if (!options.submit.settings.form) {
                    window.debug('$.validate - Undefined property "options.submit.settings.form" - Validation dropped.');
                    return;
                }

                node = $(options.submit.settings.form);

                if (!node[0]) {
                    window.debug('$.validate - Unable to find jQuery form element "options.submit.settings.form" - ' + options.submit.settings.form + ' - Validation dropped.');
                    return;
                }

            } else if (typeof node[0] === 'undefined') {

                window.debug('$("' + node['selector'] + '").validate() - Unable to find jQuery element - Validation dropped.');
                return;

            }

            return node.each(function () {

                window.Validation[node.selector] = new Validation(this, options);

            });

        },

        /**
         * API method to handle the addition of "data-validation" arguments.
         * Note: ONLY the predefined validation arguments are allowed to be added
         * inside the "data-validation" attribute (see configuration).
         *
         * @param {object} node jQuery objects
         * @param {string|array} validation arguments to add in the node(s) "data-validation"
         *
         * @returns {*}
         */
        addValidation: function (node, validation) {

            var self = this;

            validation = self._splitValidation(validation);

            if (!validation) {
                return false;
            }

            return node.each( function () {

                var $this = $(this),
                    validationData = $this.attr(_data.validation),
                    validationArray = (validationData && validationData.length) ? self._splitValidation(validationData) : [],
                    oneValidation;

                for (var i = 0; i < validation.length; i++) {

                    oneValidation = self._formatValidation(validation[i]);

                    if ($.inArray(oneValidation, validationArray) === -1) {
                        validationArray.push(oneValidation);
                    }
                }

                if (validationArray.length) {
                    $this.attr(_data.validation, self._joinValidation(validationArray));
                }

            });

        },

        /**
         * API method to handle the removal of "data-validation" arguments.
         *
         * @param {object} node jQuery objects
         * @param {string|array} validation arguments to remove in the node(s) "data-validation"
         *
         * @returns {*}
         */
        removeValidation: function (node, validation) {

            var self = this;

            validation = self._splitValidation(validation);
            if (!validation) {
                return false;
            }

            return node.each( function () {

                var $this = $(this),
                    validationData = $this.attr(_data.validation),
                    validationArray = (validationData && validationData.length) ? self._splitValidation(validationData) : [],
                    oneValidation,
                    validationIndex;

                if (!validationArray.length) {
                    $this.removeAttr(_data.validation);
                    return true;
                }

                for (var i = 0; i < validation.length; i++) {
                    oneValidation = self._formatValidation(validation[i]);
                    validationIndex = $.inArray(oneValidation, validationArray);
                    if (validationIndex !== -1) {
                        validationArray.splice(validationIndex, 1);
                    }

                }

                if (!validationArray.length) {
                    $this.removeAttr(_data.validation);
                    return true;
                }

                $this.attr(_data.validation, self._joinValidation(validationArray));

            });

        },

        /**
         * API method to manually trigger a form error.
         * Note: The same form jQuery selector MUST be used to recuperate the Validation configuration.
         *
         * @example
         * $('#form-signup_v3').addError(errorMessage)
         *
         * @param {object} node jQuery object
         * @param {object} error Object of errors to add on the node
         *
         * @returns {*}
         */
        addError: function (node, error) {

            if (!window.Validation[node.selector]) {
                window.debug('$.addError - Invalid node selector - Make sure you are using the same one you initialize the Validation with.');
                return false;
            }

            if (typeof error !== "object" || $.isEmptyObject(error)) {
                window.debug('$.addError - Invalid error object.');
                return false;
            }

            for (var inputName in error) {

                if (!error.hasOwnProperty(inputName)) {
                    continue;
                }

                if (typeof error[inputName] === "string") {
                    window.Validation[node.selector].registerError(inputName, error[inputName])
                } else if (error[inputName] instanceof Array) {

                    for (var i = 0; i < error[inputName].length; i++) {
                        window.Validation[node.selector].registerError(inputName, error[inputName][i])
                    }

                } else {
                    window.debug('$.addError - Invalid error object property - Accepted format: {"inputName": "errorString"} or {"inputName": ["errorString", "errorString"]}.');
                    continue;
                }

                window.Validation[node.selector].displayOneError(inputName);

            }

        }

    };

    /**
     * Creates a fail-safe debugging system inside the console
     */
    window.debug = function () {
        if (this.console && this.console.debug) {
            this.console.debug('DEBUG: ' + Array.prototype.slice.call(arguments));
        } else {
            window.log('DEBUG: ' + Array.prototype.slice.call(arguments));
        }
    };

    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

}(window, document, window.jQuery));