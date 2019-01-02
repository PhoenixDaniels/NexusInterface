// External Dependencies
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import ReactTable from 'react-table';
import { remote } from 'electron';
import { VictoryArea, VictoryChart, VictoryAnimation } from 'victory';
import googleanalytics from 'scripts/googleanalytics';

// Internal Global Dependencies
import * as TYPE from 'actions/actiontypes';
import Icon from 'components/Icon';
import Panel from 'components/Panel';
import Text from 'components/Text';
import ContextMenuBuilder from 'contextmenu';
import * as actionsCreators from 'actions/marketActionCreators';

// Internal Local Dependencies
import MarketDepth from './Chart/MarketDepth';
import Candlestick from './Chart/Candlestick';
import styles from './style.css';

// Images
import chartIcon from 'images/chart.sprite.svg';
import bittrexLogo from 'images/BittrexLogo.png';
import binanceLogo from 'images/BINANCE.png';
import cryptopiaLogo from 'images/CryptopiaLogo.png';
import binanceSmallLogo from 'images/binanceSmallLogo.png';
import bittrexSmallLogo from 'images/bittrexSmallLogo.png';
import cryptopiaSmallLogo from 'images/cryptopiaSmallLogo.png';
import arrow from 'images/arrow.svg';

// React-Redux mandatory methods
const mapStateToProps = state => {
  return { ...state.market, ...state.common, ...state.intl, ...state.settings };
};
const mapDispatchToProps = dispatch =>
  bindActionCreators(actionsCreators, dispatch);

class Market extends Component {
  // React Method (Life cycle hook)
  componentDidMount() {
    this.refresher();
    googleanalytics.SendScreen('Market');
    window.addEventListener('contextmenu', this.setupcontextmenu, false);
  }
  // React Method (Life cycle hook)
  componentWillUnmount() {
    window.removeEventListener('contextmenu', this.setupcontextmenu);
  }

  // Class Methods
  setupcontextmenu(e) {
    e.preventDefault();
    const contextmenu = new ContextMenuBuilder().defaultContext;
    //build default
    let defaultcontextmenu = remote.Menu.buildFromTemplate(contextmenu);
    defaultcontextmenu.popup(remote.getCurrentWindow());
  }

  refresher() {
    let any = this;
    this.props.binanceDepthLoader();
    this.props.bittrexDepthLoader();
    this.props.cryptopiaDepthLoader();
    this.props.binanceCandlestickLoader(any);
    this.props.bittrexCandlestickLoader(any);
    this.props.cryptopiaCandlestickLoader(any);
    this.props.binance24hrInfo();
    this.props.bittrex24hrInfo();
    this.props.cryptopia24hrInfo();
  }

  formatBuyData(array) {
    let newQuantity = 0;
    let prevQuantity = 0;
    let finnishedArray = array
      .map(e => {
        newQuantity = prevQuantity + e.Volume;
        prevQuantity = newQuantity;

        if (e.Price < array[0].Price * 0.05) {
          return {
            x: 0,
            y: newQuantity,
          };
        } else {
          return {
            x: e.Price,
            y: newQuantity,
            label: `${this.props.messages['Market.Price']}: ${e.Price} \n ${
              this.props.messages['Market.Volume']
            }: ${newQuantity}`,
          };
        }
      })
      .filter(e => e.x > 0);

    return finnishedArray;
  }

  formatSellData(array) {
    let newQuantity = 0;
    let prevQuantity = 0;
    let finnishedArray = array
      .sort((a, b) => b.Rate - a.Rate)
      .map(e => {
        newQuantity = prevQuantity + e.Volume;
        prevQuantity = newQuantity;
        if (e.Price < array[0].Price * 0.05) {
          return {
            x: 0,
            y: newQuantity,
          };
        } else {
          return {
            x: e.Price,
            y: newQuantity,
            label: `Price: ${e.Price} \n Volume: ${newQuantity}`,
          };
        }
      })
      .filter(e => e.x > 0);

    return finnishedArray;
  }

  formatChartData(exchange) {
    const dataSetArray = [];
    switch (exchange) {
      case 'binanceBuy':
        return this.formatBuyData(this.props.binance.buy);
        break;
      case 'binanceSell':
        return this.formatBuyData(this.props.binance.sell);
        break;
      case 'bittrexBuy':
        return this.formatBuyData(this.props.bittrex.buy);
        break;
      case 'bittrexSell':
        return this.formatBuyData(this.props.bittrex.sell);
        break;
      case 'cryptopiaBuy':
        return this.formatBuyData(this.props.cryptopia.buy);
        break;
      case 'cryptopiaSell':
        return this.formatBuyData(this.props.cryptopia.sell);
        break;
      default:
        return [];
        break;
    }
  }

  oneDayinfo(failedExchange) {
    return (
      <div>
        <h3>
          {failedExchange.charAt(0).toUpperCase() + failedExchange.slice(1)}{' '}
          24hr Data
        </h3>
        {failedExchange === 'cryptopia' ? (
          <div>
            Percent change: {this.props[failedExchange].info24hr.change}
            {' %'}
          </div>
        ) : (
          <div>
            Price Change: {this.props[failedExchange].info24hr.change}
            {' BTC'}
          </div>
        )}
        <div>
          High: {this.props[failedExchange].info24hr.high}
          {' BTC'}
        </div>
        <div>
          Low: {this.props[failedExchange].info24hr.low}
          {' BTC'}
        </div>
        <div>
          Volume: {this.props[failedExchange].info24hr.volume}
          {' NXS'}
        </div>
      </div>
    );
  }

  // Mandatory React method
  render() {
    return (
      <Panel icon={chartIcon} title={<Text id="Market.Information" />}>
        <a className="refresh" onClick={() => this.refresher()}>
          <Text id="Market.Refreash" />
        </a>
        {/* <div className="alertbox">{this.arbitageAlert()}</div> */}

        {this.props.loaded && this.props.binance.buy[0] && (
          <div className="exchangeUnitContainer">
            <img className="exchangeLogo" src={binanceLogo} />
            <div className="marketInfoContainer">
              <MarketDepth
                chartData={this.formatChartData('binanceBuy')}
                chartSellData={this.formatChartData('binanceSell')}
              />
              {this.props.binance.candlesticks[0] !== undefined ? (
                <Candlestick data={this.props.binance.candlesticks} />
              ) : (
                this.oneDayinfo('binance')
              )}
            </div>
          </div>
        )}
        {this.props.loaded && this.props.bittrex.buy[0] && (
          <div className="exchangeUnitContainer">
            <img className="exchangeLogo" src={bittrexLogo} />
            <div className="marketInfoContainer">
              <MarketDepth
                chartData={this.formatChartData('bittrexBuy')}
                chartSellData={this.formatChartData('bittrexSell')}
              />
              {this.props.bittrex.candlesticks[0] !== undefined ? (
                <Candlestick data={this.props.bittrex.candlesticks} />
              ) : (
                this.oneDayinfo('bittrex')
              )}
            </div>
          </div>
        )}
        {this.props.loaded && this.props.cryptopia.buy[0] && (
          <div className="exchangeUnitContainer">
            <img className="exchangeLogo" src={cryptopiaLogo} />
            <div className="marketInfoContainer">
              <MarketDepth
                chartData={this.formatChartData('cryptopiaBuy')}
                chartSellData={this.formatChartData('cryptopiaSell')}
              />

              {this.props.cryptopia.candlesticks[0] !== undefined ? (
                <Candlestick data={this.props.cryptopia.candlesticks} />
              ) : (
                this.oneDayinfo('cryptopia')
              )}
            </div>
          </div>
        )}
      </Panel>
    );
  }
}

// Mandatory React-Redux method
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Market);
