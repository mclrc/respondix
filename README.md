# respond
A lightweight but powerful reactivity library

This library was written with the goal of gaining a better understanding of the inner workings of frameworks like Vue. It is not intended for use in serious projects.

Nevertheless, it can probably do most things you would want a Vue-like reactivity library to do while keeping the code short and readable, so you might get some use out of it.

### Design
Proxy based reactivity libraries usually employ two main constructs: Jobs and reactive state. (Sometimes different terms are used)

A **job** is simply any operation whose outcome depends on reactive state and that should be repeated whenever said state changes. The classic example would be a render function in a front end framework.

**Reactive state** is any state that jobs can depend on. One huge advantage to a proxy-based approach is that you can treat this state like any other JavaScript object. No setState, shouldComponentUpdate, etc. - eveything pretty much "just works."

### API
Respond's API consists of only two main functions: `watch` and `makeReactive`. The former takes in a function and creates a job from it, which is run immediately. The latter takes in a JS object or array and returns a reactive version of it, which can be treated in all the same ways as the original input - with the only difference being the dependency tracking and job-rerunning respond will now perform when needed. Push to and pop from arrays, modify random elements in the middle, save objects in new properties on other objects, call methods that internally modify state, it will all get picked up by respond.

If you want to create a job manually without running it immediately, you can use the `Job` constructor. It also takes in a function. Jobs can be run with `job.run()` and destroyed with `job.destroy()`. This will also remove the job as a dependent from any and all state, ensuring that it gets garbage collected. The same will happen with all outdated dependencies - If a reactive object in an array that was previously traversed in a job is not touched anymore on the next rerun, which will inevitably occur immediately after it is removed, all references to and from that state will be deleted.

### Example
```ts
import { makeReactive, watch } from 'respond'

const shoppingList = makeReactive({
	items: [
		{ name: 'Spaghetti', price: 4 },
		{ name: 'Soap', price: 2 },
		{ name: 'Water', price: 5 }
	],
	totalPrice: null
})

watch(() => 
	shoppingList.totalPrice = 
	shoppingList.items.reduce((acc, cur) => acc + cur.price, 0)
)

watch(() => console.log(shoppingList.totalPrice))

setTimeout(() =>
	shoppingList.items.push({ name: 'Eggs', price: 3 }),
	1000
)

setTimeout(() =>
	shoppingList.items[2].name = 'Dish Soap', 
	2000
)

setTimeout(() => 
 shoppingList.items[1].price++,
	3000
)
```
In this case, we have one piece of reactive state containing items with names and prices and a total price. Then we create and run two jobs: one to keep the total price updated, and one to output the total price to the console anytime it changes. Obviously this is not the best way to do things in this case, but for demonstration purposes, it will suffice.
Then, we set three timeouts that modify the state in different ways. Notice how nothing happens after two seconds. This is because changing the name of an item has no impact on the final price. Thus, the jobs are not dependent on them and therefore not rerun. After one and three seconds though, you will see the updated price in the console.
