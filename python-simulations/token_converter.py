class Connector(object):
    def __init__(self, weight, balance):
        self.weight = weight
        self.balance = balance


class TokenConverter(object):
    MAX_WEIGHT = 1000000
    BUY = 'buy'
    SELL = 'sell'
    GENERAL_PRICING = 'general'
    SPECIFIC_PRICING = 'specific'
    # TODO:Set initial token price from CMC. Determine Connector Weight from price.

    def __init__(self, token_weight: int, token_balance: int, eth_weight: int, eth_balance: int, pricing_method: str):
        assert (token_weight + eth_weight) <= self.MAX_WEIGHT
        assert (token_balance > 0) and (eth_balance > 0)
        self.pricing_method = pricing_method
        self.token_connector = Connector(token_weight, token_balance)
        self.eth_connector = Connector(eth_weight, eth_balance)

    # =====================================================================================

    def buy(self, eth_spent):
        assert eth_spent > 0
        tokens_received = self.calculate_return(eth_spent, self.BUY)
        effective_price = self.get_effective_price(tokens_received, eth_spent)
        self.decrease_balance(self.token_connector, tokens_received)
        self.increase_balance(self.eth_connector, eth_spent)
        return tokens_received, effective_price

    def sell(self, tokens_spent):
        assert tokens_spent > 0
        eth_received = self.calculate_return(tokens_spent, self.SELL)
        effective_price = self.get_effective_price(tokens_spent, eth_received)
        self.decrease_balance(self.eth_connector, eth_received)
        self.increase_balance(self.token_connector, tokens_spent)
        return eth_received, effective_price

    def calculate_return(self, _amount, _transaction_type: str):
        pricing_method = self.get_pricing_method(_transaction_type)
        return pricing_method(_amount, _transaction_type)

    # Formula:
    # Return = _toConnectorBalance * (1 - (_fromConnectorBalance / (_fromConnectorBalance + _amount)) ^ (_fromConnectorWeight / _toConnectorWeight))
    def calculate_cross_connector_return(self, _sell_amount, _transaction_type: str):
        if _transaction_type is self.BUY:
            _from, _to = self.eth_connector, self.token_connector
        else:
            _from, _to = self.token_connector, self.eth_connector

        return _to.balance * (1 - (_from.balance / (_from.balance + _sell_amount)) ** (_from.weight / _to.weight))

    # Purchase Formula:
    # Return = _supply * ((1 + _depositAmount / _connectorBalance) ^ (_connectorWeight / 1000000) - 1)
    def calculate_purchase_return(self, _deposit_amount, _transaction_type: str):
        return self.token_connector.balance * ((1 + _deposit_amount / self.eth_connector.balance) **
                                               (self.eth_connector.weight / self.MAX_WEIGHT) - 1)

    # Sale Formula:
    # Return = _connectorBalance * (1 - (1 - _sellAmount / _supply) ^ (1 / (_connectorWeight / 1000000)))
    def calculate_sale_return(self, _sell_amount, _transaction_type: str):
        return self.eth_connector.balance * (1 - (1 - _sell_amount / self.token_connector.balance) **
                                             (1 / (self.eth_connector.weight / self.MAX_WEIGHT)))

    def get_pricing_method(self, _transaction_type: str):
        methods = {
            self.GENERAL_PRICING: self.calculate_cross_connector_return,
            self.SPECIFIC_PRICING: {self.BUY: self.calculate_purchase_return, self.SELL: self.calculate_sale_return}
        }
        method = methods.get(self.pricing_method)
        if type(method) is dict:
            return method.get(_transaction_type)
        return method

    @staticmethod
    def get_effective_price(tokens, eth):
        return eth / tokens

    @staticmethod
    def increase_balance(connector: Connector, amount):
        connector.balance += amount

    @staticmethod
    def decrease_balance(connector: Connector, amount):
        assert amount < connector.balance
        connector.balance -= amount
