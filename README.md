# respondix
A lightweight but powerful reactivity library

This library was written with the goal of gaining a better understanding of the inner workings of frameworks like Vue. It is not intended for use in serious projects.

Nevertheless, it can probably do most things you would want a Vue-like reactivity library to do while keeping the code short and readable, so you might get some use out of it.

## Usage
Proxy-based reactivity employs two main constructs.

### Reactive state

You can call `makeReactive` on an array or an object to return a reactive version of that object.
```ts
import { makeReactive } from 'respondix'

// `shoppingList` is a reactive object. So is `shoppingList.items` and all items within it
const shoppingList = makeReactive({
    items: [
        { name: 'Spaghetti', price: 4 },
        { name: 'Soap', price: 2 },
        { name: 'Water', price: 5 }
    ],
})
```

### Jobs 

A job is any operation that depends on reactive state and that should be rerun when that state changes. An example would be a component render function.
Jobs are created with `watch`, which will create a job out of the passed function and run it immediately.
```ts
import { watch } from 'respondix'

// Anytime the shopping list changes, we want to output the updated price to the console
const job = watch(() => {
    console.log(shoppingList.items.reduce((acc, item) => acc + item.price, 0))
})

// When you want to remove the job, use the `destroy` method.
job.destroy()

shoppingList.items[0].price++ // Nothing happens here
```
Note that in the above example, changing the name of an item or similar will not result in a rerun, because the job only depends on the prices.

If you don't want to run a job immediately, you can use the constructor and later the run method directly.
```ts
import { Job } from 'respondix'

const job = new Job(() => foo())

// Do stuff

job.run()
```
