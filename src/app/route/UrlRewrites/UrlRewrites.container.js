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

import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import { HistoryType, LocationType, MatchType } from 'Type/Common';
import { appendWithStoreCode } from 'Util/Url';

import UrlRewrites from './UrlRewrites.component';
import {
    TYPE_CATEGORY,
    TYPE_CMS_PAGE,
    TYPE_NOTFOUND,
    TYPE_PRODUCT
} from './UrlRewrites.config';

const UrlRewritesDispatcher = import(
    /* webpackMode: "lazy", webpackChunkName: "dispatchers" */
    'Store/UrlRewrites/UrlRewrites.dispatcher'
);

export const mapStateToProps = (state) => ({
    urlRewrite: state.UrlRewritesReducer.urlRewrite,
    isLoading: state.UrlRewritesReducer.isLoading,
    requestedUrl: state.UrlRewritesReducer.requestedUrl
});

export const mapDispatchToProps = (dispatch) => ({
    requestUrlRewrite: (urlParam) => {
        UrlRewritesDispatcher.then(
            ({ default: dispatcher }) => dispatcher.handleData(dispatch, {
                // TODO: this seems to break when switched to disabled-url-stores
                urlParam: urlParam.replace(new RegExp(window.storeRegexText), '')
            })
        );
    }
});

export class UrlRewritesContainer extends PureComponent {
    static propTypes = {
        location: LocationType.isRequired,
        match: MatchType.isRequired,
        history: HistoryType.isRequired,
        isLoading: PropTypes.bool.isRequired,
        requestedUrl: PropTypes.string,
        requestUrlRewrite: PropTypes.func.isRequired,
        urlRewrite: PropTypes.shape({
            id: PropTypes.number,
            type: PropTypes.string,
            sku: PropTypes.string,
            notFound: PropTypes.bool
        }).isRequired
    };

    static defaultProps = {
        requestedUrl: ''
    };

    static stateMapping = {
        category: TYPE_CATEGORY,
        product: TYPE_PRODUCT,
        page: TYPE_CMS_PAGE
    };

    constructor(props) {
        super(props);

        this.requestUrlRewrite();
    }

    componentDidMount() {
        this.initialUrl = location.pathname;
    }

    componentDidUpdate() {
        const { isLoading } = this.props;

        /**
         * If the latest requested URL rewrite is not related
         * to the current location, and the URL rewrites are not loading
         * request new URL rewrite.
         */
        if (this.getIsLoading() && !isLoading) {
            this.requestUrlRewrite();
        }
    }

    containerProps = () => ({
        type: this.getType(),
        props: this.getProps()
    });

    getTypeSpecificProps() {
        const {
            urlRewrite: {
                id,
                sku
            }
        } = this.props;

        const isLoading = this.getIsLoading();

        switch (this.getType()) {
        case TYPE_PRODUCT:
            /**
             * In case we are not yet sure what product ID it is:
             * - check if there is a hint in browser history
             * - fallback to none
             */
            if (isLoading) {
                const product = history?.state?.state?.product;

                if (product) {
                    const { sku: historySKU } = product;
                    return { productSKU: historySKU };
                }

                return {};
            }

            return { productSKU: sku };
        case TYPE_CMS_PAGE:
            if (isLoading) {
                return { isOnlyPlaceholder: true };
            }

            return { pageIds: id };
        case TYPE_CATEGORY:
            /**
             * In case we are not yet sure what category ID it is:
             * - check if there is a hint in browser history
             * - fallback to none
             */
            if (isLoading) {
                const category = history?.state?.state?.category;

                if (category && category !== true) {
                    return { categoryIds: category };
                }

                return {};
            }

            return { categoryIds: id };
        case TYPE_NOTFOUND:
        default:
            return {};
        }
    }

    getIsLoading() {
        const { requestedUrl } = this.props;
        return location.pathname !== appendWithStoreCode(requestedUrl);
    }

    getProps() {
        const {
            location,
            match,
            history
        } = this.props;

        return {
            location,
            match,
            history,
            ...this.getTypeSpecificProps()
        };
    }

    getFallbackType() {
        const {
            actionName: { type: initialType = '' } = {}
        } = window;

        if (this.initialUrl === location.pathname) {
            return initialType;
        }

        return '';
    }

    getType() {
        const { urlRewrite: { type, notFound } } = this.props;

        /**
         * If the URL rewrite is loading, prefer state-defined URL type,
         * else fallback to one defined in HTML document by PHP controller
         * (which is only valid for 1st load).
         */
        if (this.getIsLoading()) {
            const state = history?.state?.state || {};
            const typeKey = Object.keys(state).find((key) => UrlRewritesContainer.stateMapping[key]);

            if (typeKey) {
                return UrlRewritesContainer.stateMapping[typeKey];
            }

            /**
             * Otherwise fallback to other guessed types - from window i.e.
             */
            return this.getFallbackType();
        }

        if (notFound) {
            return TYPE_NOTFOUND;
        }

        if (type) {
            return type;
        }

        return '';
    }

    requestUrlRewrite() {
        const { requestUrlRewrite } = this.props;
        return requestUrlRewrite(location.pathname);
    }

    render() {
        return (
            <UrlRewrites
              { ...this.containerProps() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(UrlRewritesContainer);
