/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import ExpandableContent from 'Component/ExpandableContent';
// eslint-disable-next-line max-len
import ProductConfigurableAttributes from 'Component/ProductConfigurableAttributes/ProductConfigurableAttributes.component';
import { formatCurrency } from 'Util/Price';

class CategoryConfigurableAttributes extends ProductConfigurableAttributes {
    constructor(props) {
        super(props);
        this.toggleDropdownClass = this.toggleDropdownClass.bind(this);
        this.state = {
            ...this.state,
            dropdownActive: false,
            dropDownItemCount: false
        };
    }

    toggleDropdownClass() {
        const currentState = this.state.dropdownActive;
        this.setState({ dropdownActive: !currentState });
    }

    getPriceLabel(option) {
        const { currency_code } = this.props;
        const { value_string } = option;
        const [from, to] = value_string.split('_');
        const currency = formatCurrency(currency_code);

        if (from === '*') {
            return __('Up to %s%s', to, currency);
        }

        if (to === '*') {
            return __('From %s%s', from, currency);
        }

        return __('From %s%s, to %s%s', from, currency, to, currency);
    }

    renderPriceSwatch(option) {
        const { attribute_options, ...priceOption } = option;

        if (attribute_options) {
            // do not render price filter if it includes "*_*" aggregation
            if (attribute_options['*_*']) {
                return null;
            }

            priceOption.attribute_options = Object.entries(attribute_options).reduce((acc, [key, option]) => {
                acc[key] = {
                    ...option,
                    label: this.getPriceLabel(option)
                };

                return acc;
            }, {});
        }

        return this.renderDropdownOrSwatch(priceOption);
    }

    renderDropdownOrSwatch(option) {
        const {
            isContentExpanded,
            getSubHeading
        } = this.props;

        const {
            attribute_label,
            attribute_code,
            attribute_options
        } = option;

        const [{ swatch_data }] = attribute_options ? Object.values(attribute_options) : [{}];
        const isSwatch = !!swatch_data;

        return (
            <ExpandableContent
              key={ attribute_code }
              heading={ attribute_label }
              subHeading={ getSubHeading(option) }
              mix={ {
                  block: 'ProductConfigurableAttributes',
                  elem: 'Expandable'
              } }
              isContentExpanded={ isContentExpanded }
            >
                { isSwatch
                    ? this.renderSwatch(option)
                    : [this.renderDropdown(option), this.renderDropDownButton(option)] }
            </ExpandableContent>
        );
    }

    renderConfigurableOption = (option) => {
        const { attribute_code } = option;

        switch (attribute_code) {
        case 'price':
            return this.renderPriceSwatch(option);
        default:
            return this.renderDropdownOrSwatch(option);
        }
    };

    renderConfigurableAttributes() {
        const { configurable_options } = this.props;

        return Object.values(configurable_options)
            .map(this.renderConfigurableOption);
    }

    renderDropDownButton(option) {
        const { attribute_values } = option;

        if (attribute_values.length > 6) {
            this.state.dropDownItemCount = true;
        }

        if (!this.state.dropDownItemCount) {
            return null;
        }

        // resetting state for other filter items
        this.state.dropDownItemCount = false;

        return (
            <button
              onClick={ this.toggleDropdownClass }
              block="Button ExtendCategory"
            >
                <span>{ __('Show more') }</span>
                <span>{ __('Show less') }</span>
            </button>
        );
    }

    renderDropdown(option) {
        const { attribute_values } = option;

        return (
            <div
              block="ProductConfigurableAttributes"
              elem="DropDownList"
              mods={ { isVisible: this.state.dropdownActive } }
            >
                { attribute_values.map((attribute_value) => (
                    this.renderConfigurableAttributeValue({ ...option, attribute_value })
                )) }
            </div>
        );
    }
}

export default CategoryConfigurableAttributes;
