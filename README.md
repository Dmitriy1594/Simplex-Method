# Simplex Method

### Examples

###### 1. Standard Form Maximization LP

Consider the following objective function and constraints:

<p align="center">
<img src="https://raw.githubusercontent.com/MichaelStott/SimplexSolver/master/img/example1a.png">
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/MichaelStott/SimplexSolver/master/img/example1b.png">
</p>
This problem can be solved by running the script with the following parameters:

```sh
$ python simplex.py -m "[[2,1],[1,2]]" -b "[4,3]" -c "[1,1]" -p max
```

###### 2. Standard Form Minimization LP

Consider the following objective function and constraints:

<p align="center">
<img src="https://raw.githubusercontent.com/MichaelStott/SimplexSolver/master/img/example2a.png">
</p>
<p align="center">
<img src="https://raw.githubusercontent.com/MichaelStott/SimplexSolver/master/img/example2b.png">
</p>
This problem can be solved by running the script with the following parameters:

```sh
$ python simplex.py -m "[[2,1],[1,1]]" -b "[6,4]" -c "[3,2]" -p min
```

<div id="ad54"></div>
<script>
	var iframe = document.createElement("iframe");
	iframe.frameBorder=0;
	iframe.width="890";
	iframe.height="550";
	iframe.id="randomid";iframe.setAttribute("src", "https://www.mathstools.com/section/widget/simplex_online_calculator");
	document.getElementById("ad54").appendChild(iframe);
</script>

### Links
- [An Example of Two Phase Simplex Method](http://optlab.mcmaster.ca/feng/4O03/Two.Phase.Simplex.pdf)
