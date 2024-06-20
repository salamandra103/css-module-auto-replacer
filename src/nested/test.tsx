import classnames from 'classnames'
import {Example2} from "./test2.js"

const Example = () => {
    let c = 1;
    <div className="dsad">1</div>;
    <div className={classnames('aaa')}>1</div>;
    <div className={classnames({a: true})}>1</div>;
    <div className={classnames('bbb', {a: c === 1})}>1</div>;
    <Example2/>
    return null
}

const A = 1;