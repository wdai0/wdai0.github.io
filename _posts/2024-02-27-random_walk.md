## Use random walk in finanical data

'random walk on Wall street'

what's a drift?

## Review on `ACF` and `PACF`

### ACF

The ACF, at lag $k$, is defined as the correlation between values of the series at time $t$
and its value at time $t + k$. It can be expressed for a time series $Y_t$ as
$$\text{ACF}(k) = \frac{\sum_{t = 1}^{N -k} (Y_t - \bar{Y})(Y_{t + k} - \bar{Y})}
{\sum_{t=1}^{N} (Y_t - \bar{Y})^2}$$,
where $N$ is the length of the time series, $k$ is the lag, $Y_t$ is the value at time $t$,
and $\bar{Y}$ is the mean of $Y_t$.

### PACF

The PACF at lag \$k$, denoted by $\alpha(k)$, for a stationary time series $y_t$, is defined as the correlation between $y_t$ and $y_{t-k}$, with the effects of $y_{t-1}, y_{t-2}, \ldots, y_{t-k+1}$ removed. This can be formally represented as the coefficient of $y_{t-k}$ in an AR model of order $k$ that fits the data:

$$\alpha(k) = \text{Corr}(y_t - \hat{y}_t, y_{t-k} - \hat{y}_{t-k})$$

where $\hat{y}_t$ and $\hat{y}_{t-k}$ are the predicted values of $y_t$ and $y_{t-k}$ based on the intermediate lags.
